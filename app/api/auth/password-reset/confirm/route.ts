import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import PasswordResetRequest from "@/models/PasswordResetRequest"
import User from "@/models/User"
import { hashPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = (await req.json()) as {
      requestId?: string
      password?: string
      confirmPassword?: string
    }

    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : ""

    if (!requestId || !password || !confirmPassword) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "As senhas não conferem" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter ao menos 6 caracteres" }, { status: 400 })
    }

    const resetRequest = await PasswordResetRequest.findOne({ requestId })
    if (!resetRequest) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    if (resetRequest.usedAt) {
      return NextResponse.json({ error: "Solicitação já utilizada" }, { status: 400 })
    }

    if (!resetRequest.verifiedAt) {
      return NextResponse.json({ error: "Email ainda não verificado" }, { status: 403 })
    }

    if (resetRequest.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Solicitação expirada" }, { status: 400 })
    }

    if (!resetRequest.userId) {
      return NextResponse.json({ error: "Usuário não encontrado para esta solicitação" }, { status: 404 })
    }

    const user = await User.findById(resetRequest.userId)
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado para esta solicitação" }, { status: 404 })
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Usuário já autenticado com Google. Faça login com Google." },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)
    await User.collection.updateOne(
      { _id: resetRequest.userId as never },
      {
        $set: {
          passwordHash,
        },
      }
    )

    resetRequest.usedAt = new Date()
    await resetRequest.save()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Erro ao confirmar redefinição de senha:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
