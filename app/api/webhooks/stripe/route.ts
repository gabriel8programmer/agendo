import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { stripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("stripe-signature")
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event: Stripe.Event

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      } catch (err) {
        console.error("Erro na verificação da assinatura do webhook Stripe:", err)
        return NextResponse.json({ error: "Assinatura do webhook inválida" }, { status: 400 })
      }
    } else {
      try {
        event = JSON.parse(rawBody) as Stripe.Event
      } catch {
        return NextResponse.json({ error: "Payload do webhook inválido" }, { status: 400 })
      }
    }

    await dbConnect()

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId
        const plan = (session.metadata?.plan as "monthly" | "annual") || "monthly"
        const customerId = session.customer ? String(session.customer) : undefined
        const subscriptionId = session.subscription ? String(session.subscription) : undefined

        if (userId) {
          const now = new Date()
          let expiresAt: Date | undefined = undefined

          if (session.mode === "payment") {
            // Pagamento avulso (ex: Pix ou Cartão à vista)
            const daysToAdd = plan === "annual" ? 365 : 30
            expiresAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
          }

          await User.collection.updateOne(
            { _id: userId as never },
            {
              $set: {
                subscriptionPlan: plan,
                subscriptionStatus: "active",
                ...(customerId ? { stripeCustomerId: customerId } : {}),
                ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
                ...(expiresAt ? { subscriptionExpiresAt: expiresAt } : {}),
              },
            }
          )
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const status = subscription.status
        const customerId = String(subscription.customer)

        const normalizedStatus =
          status === "active" || status === "trialing"
            ? "active"
            : status === "past_due"
              ? "past_due"
              : status === "canceled"
                ? "canceled"
                : "inactive"

        await User.collection.updateOne(
          {
            $or: [{ stripeSubscriptionId: subscription.id }, { stripeCustomerId: customerId }],
          },
          {
            $set: {
              subscriptionStatus: normalizedStatus,
              stripeSubscriptionId: subscription.id,
            },
          }
        )
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await User.collection.updateOne(
          {
            $or: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: String(subscription.customer) },
            ],
          },
          {
            $set: {
              subscriptionStatus: "canceled",
              subscriptionPlan: "free",
            },
          }
        )
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer ? String(invoice.customer) : undefined
        if (customerId) {
          await User.collection.updateOne(
            { stripeCustomerId: customerId },
            {
              $set: {
                subscriptionStatus: "active",
              },
            }
          )
        }
        break
      }

      default:
        // Outros eventos são ignorados sem erro
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Erro no processamento do webhook Stripe:", error)
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 })
  }
}
