import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth"
import { stripe, PLANS, PlanKey } from "@/lib/stripe"

export async function GET() {
  return NextResponse.json({
    plans: Object.values(PLANS),
  })
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const payload = verifySessionToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as {
      plan?: string
      mode?: "payment" | "subscription"
    }

    const planKey = body.plan as PlanKey
    if (!planKey || !PLANS[planKey]) {
      return NextResponse.json({ error: "Plano inválido ou não informado" }, { status: 400 })
    }

    const planConfig = PLANS[planKey]
    const checkoutMode = body.mode === "subscription" ? "subscription" : "payment"

    await dbConnect()
    const user = await User.findById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    let customerId = user.stripeCustomerId
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: String(user._id),
          },
        })
        customerId = customer.id
        await User.collection.updateOne(
          { _id: user._id as never },
          { $set: { stripeCustomerId: customerId } }
        )
      } catch (custErr) {
        console.warn("Aviso ao criar/vincular cliente Stripe:", custErr)
      }
    }

    const origin = req.headers.get("origin") || process.env.APP_URL || "http://localhost:3000"

    const isSubscription = checkoutMode === "subscription"

    // No modo payment suportamos Cartão e Pix. No modo subscription suportamos Cartão.
    const paymentMethodTypes = isSubscription
      ? (["card"] as Array<"card" | "pix">)
      : (["card", "pix"] as Array<"card" | "pix">)

    const lineItems = planConfig.priceId
      ? [{ price: planConfig.priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `Agendo - ${planConfig.name}`,
                description: planConfig.description,
              },
              unit_amount: planConfig.priceCents,
              ...(isSubscription
                ? {
                    recurring: {
                      interval: planConfig.interval,
                    },
                  }
                : {}),
            },
            quantity: 1,
          },
        ]

    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      payment_method_types: paymentMethodTypes,
      customer: customerId || undefined,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: String(user._id),
      line_items: lineItems,
      success_url: `${origin}/configuracoes?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/planos?checkout=canceled`,
      metadata: {
        userId: String(user._id),
        plan: planConfig.id,
        mode: checkoutMode,
      },
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error("Erro ao criar sessão de checkout Stripe:", error)
    return NextResponse.json({ error: "Erro interno ao processar pagamento" }, { status: 500 })
  }
}
