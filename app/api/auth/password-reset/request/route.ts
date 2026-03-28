import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import PasswordResetRequest from "@/models/PasswordResetRequest"
import { buildVerifyEmailTemplate } from "@/lib/email/templates/verifyEmailTemplate"
import { sendEmail } from "@/lib/email/mailer"
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/auth"

const RESET_TTL_MINUTES = 30

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

    const requestId = generateOpaqueToken(24)
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000)
    const user = await User.findOne({ email })

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

