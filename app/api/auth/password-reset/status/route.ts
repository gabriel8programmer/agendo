import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import PasswordResetRequest from "@/models/PasswordResetRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const requestId = req.nextUrl.searchParams.get("requestId") || ""

    if (!requestId) {
      return NextResponse.json({ error: "requestId é obrigatório" }, { status: 400 })
    }

    const resetRequest = await PasswordResetRequest.findOne({ requestId })
    if (!resetRequest) {
      return NextResponse.json({ status: "not_found", verified: false }, { status: 404 })
    }

    if (resetRequest.usedAt) {
      return NextResponse.json({ status: "used", verified: false })
    }

    if (resetRequest.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ status: "expired", verified: false })
    }

    if (resetRequest.verifiedAt) {
      return NextResponse.json({ status: "verified", verified: true })
    }

    return NextResponse.json({ status: "pending", verified: false })
  } catch (error) {
    console.error("Erro ao consultar status da redefinição:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

