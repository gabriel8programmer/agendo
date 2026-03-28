import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { createSessionToken, hashPassword, SESSION_COOKIE, SESSION_HINT_COOKIE, toSafeSlug } from "@/lib/auth"

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
    const body = (await req.json()) as { name?: string; email?: string; password?: string }

    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter ao menos 6 caracteres" }, { status: 400 })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 })
    }

    const baseSlug = toSafeSlug(name) || "usuario"
    let slug = baseSlug
    let suffix = 1
    while (await User.findOne({ slug })) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    const passwordHash = await hashPassword(password)
    const user = await User.create({
      name,
      companyName: name,
      email,
      slug,
      slugLocked: false,
      passwordHash,
    })

    await User.collection.updateOne(
      { _id: user._id },
      {
        $set: {
          companyName: name,
          slugLocked: false,
        },
      }
    )

    const safeUser = sanitizeUser(user)
    const token = createSessionToken({
      userId: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
    })

    const res = NextResponse.json({ user: safeUser }, { status: 201 })
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
    console.error("Erro ao cadastrar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
