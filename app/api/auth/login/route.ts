import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { createSessionToken, SESSION_COOKIE, SESSION_HINT_COOKIE, verifyPassword } from "@/lib/auth"

function sanitizeUser(user: {
  _id?: unknown
  name?: string
  companyName?: string
  email?: string
  slug?: string
  slugLocked?: boolean
  createdAt?: Date | string
}) {
  return {
    id: String(user._id || ""),
    name: String(user.name || ""),
    companyName: String(user.companyName || user.name || ""),
    email: String(user.email || ""),
    slug: String(user.slug || ""),
    slugLocked: Boolean(user.slugLocked),
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = (await req.json()) as { email?: string; password?: string }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const user = await User.findOne({ email })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const safeUser = sanitizeUser(user)
    const token = createSessionToken({
      userId: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
    })

    const res = NextResponse.json({ user: safeUser })
    const secure = process.env.NODE_ENV === "production"
    res.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    res.cookies.set({
      name: SESSION_HINT_COOKIE,
      value: "1",
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return res
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
