import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
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
    const user = (await User.findById(payload.userId).lean()) as
      | {
          _id: unknown
          name?: string
          companyName?: string
          email?: string
          slug?: string
          slugLocked?: boolean
          createdAt?: Date | string
        }
      | null
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Backfill automático para usuários antigos (antes de companyName existir).
    if (!user.companyName || !String(user.companyName).trim()) {
      await User.collection.updateOne(
        { _id: user._id as never },
        {
          $set: {
            companyName: user.name || "",
          },
        }
      )
    }

    return NextResponse.json({
      user: {
        id: String(user._id),
        name: String(user.name || ""),
        companyName: String(user.companyName || user.name || ""),
        email: String(user.email || ""),
        slug: String(user.slug || ""),
        slugLocked: Boolean(user.slugLocked),
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar sessão atual:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
