import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await dbConnect()
    const { slug } = await params

    const user = await User.findOne({ slug })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Erro ao buscar usuário por slug:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
