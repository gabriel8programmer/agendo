import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await dbConnect()
    const { slug } = await params

    // lean() + payload explícito: o front usa user.id em getServices/getAvailability.
    // NextResponse.json(doc) com Document Mongoose às vezes não expõe `id` como o toJSON do schema.
    const user = await User.findOne({ slug }).lean()

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      id: String(user._id),
      name: user.name,
      slug: user.slug,
      email: user.email,
      createdAt:
        user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
    })
  } catch (error) {
    console.error("Erro ao buscar usuário por slug:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
