import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth"
import { stripe } from "@/lib/stripe"

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
      sessionId?: string
    }

    if (!body.sessionId || typeof body.sessionId !== "string") {
      return NextResponse.json({ error: "sessionId é obrigatório" }, { status: 400 })
    }

    await dbConnect()

    const session = await stripe.checkout.sessions.retrieve(body.sessionId)
    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    const userId = session.client_reference_id || session.metadata?.userId
    if (userId !== payload.userId) {
      return NextResponse.json(
        { error: "Sessão não pertence ao usuário autenticado" },
        { status: 403 }
      )
    }

    if (session.status !== "complete" && session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Sessão de checkout ainda não foi concluída" },
        { status: 400 }
      )
    }

    const plan = (session.metadata?.plan as "monthly" | "annual") || "monthly"
    const customerId = session.customer ? String(session.customer) : undefined
    const subscriptionId = session.subscription ? String(session.subscription) : undefined

    const userFilter = mongoose.Types.ObjectId.isValid(userId)
      ? {
          $or: [{ _id: userId as never }, { _id: new mongoose.Types.ObjectId(userId) as never }],
        }
      : { _id: userId as never }

    await User.collection.updateOne(userFilter, {
      $set: {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      plan,
      status: "active",
      customerId,
      subscriptionId,
    })
  } catch (error) {
    console.error("Erro ao sincronizar sessão de checkout:", error)
    return NextResponse.json({ error: "Erro interno ao sincronizar checkout" }, { status: 500 })
  }
}
