import { NextRequest, NextResponse } from "next/server"
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

    await dbConnect()
    const user = await User.findById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "Nenhuma conta de faturamento Stripe vinculada para este usuário" },
        { status: 400 }
      )
    }

    const origin = req.headers.get("origin") || process.env.APP_URL || "http://localhost:3000"

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/configuracoes`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Erro ao criar sessão do portal Stripe:", error)
    return NextResponse.json(
      { error: "Erro ao abrir portal de gerenciamento da assinatura" },
      { status: 500 }
    )
  }
}
