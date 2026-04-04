import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import PasswordResetRequest from "@/models/PasswordResetRequest"
import { buildVerifyEmailTemplate } from "@/lib/email/templates/verifyEmailTemplate"
import { sendEmail } from "@/lib/email/mailer"
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/auth"
import { buildRateLimitKey, consumeRateLimit, getClientIp } from "@/lib/security/rateLimit"

const RESET_TTL_MINUTES = 30
const PASSWORD_RESET_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000,
  maxAttempts: 5,
  blockMs: 5 * 60 * 1000,
}

function getAppUrl(req: NextRequest) {
  return process.env.APP_URL || req.nextUrl.origin
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = (await req.json()) as { email?: string }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    const ip = getClientIp(req)
    const rateLimitKey = buildRateLimitKey("password-reset-request", ip, email)
    const rateLimit = consumeRateLimit(rateLimitKey, PASSWORD_RESET_RATE_LIMIT)
    if (!rateLimit.allowed) {
      const retryInMin = Math.ceil(rateLimit.retryAfterSec / 60)
      return NextResponse.json(
        {
          error: `Muitas tentativas para recuperação de senha. Tente novamente em ${retryInMin} minuto(s).`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSec) },
        }
      )
    }

    const user = await User.findOne({ email })
    if (user && !user.passwordHash) {
      return NextResponse.json(
        { error: "Usuário já autenticado com Google. Faça login com Google." },
        { status: 400 }
      )
    }

    const requestId = generateOpaqueToken(24)
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000)

    if (user) {
      const verifyToken = generateOpaqueToken(32)
      const verifyTokenHash = hashOpaqueToken(verifyToken)

      await PasswordResetRequest.create({
        userId: String(user._id),
        email,
        requestId,
        verifyTokenHash,
        expiresAt,
      })

      const verifyUrl = `${getAppUrl(req)}/api/auth/password-reset/verify?token=${verifyToken}`
      const { subject, html, text } = buildVerifyEmailTemplate({
        verifyUrl,
        recipientName: user.name,
        productName: "Agendo",
        logoUrl: `${getAppUrl(req)}/logo.svg`,
      })

      await sendEmail({
        to: email,
        subject,
        html,
        text,
      })
    } else {
      await PasswordResetRequest.create({
        email,
        requestId,
        expiresAt,
      })
    }

    return NextResponse.json({
      ok: true,
      requestId,
    })
  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
