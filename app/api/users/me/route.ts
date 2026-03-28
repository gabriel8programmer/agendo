import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { SESSION_COOKIE, toSafeSlug, verifySessionToken } from "@/lib/auth"

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
    companyName: String(user.companyName || ""),
    email: String(user.email || ""),
    slug: String(user.slug || ""),
    slugLocked: Boolean(user.slugLocked),
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = (await req.json()) as {
      name?: string
      companyName?: string
      slug?: string
    }

    const name = typeof body.name === "string" ? body.name.trim() : undefined
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : undefined
    const requestedSlugRaw = typeof body.slug === "string" ? body.slug.trim() : undefined

    const updates: Record<string, unknown> = {}

    if (name !== undefined) {
      if (!name) return NextResponse.json({ error: "Nome inválido" }, { status: 400 })
      updates.name = name
    }

    if (companyName !== undefined) {
      if (!companyName) {
        return NextResponse.json({ error: "Nome da empresa inválido" }, { status: 400 })
      }
      updates.companyName = companyName
    }

    if (requestedSlugRaw !== undefined) {
      const safeSlug = toSafeSlug(requestedSlugRaw)
      if (!safeSlug) {
        return NextResponse.json({ error: "Slug inválido" }, { status: 400 })
      }

      const currentSlug = String(user.slug || "")
      const isChangingSlug = safeSlug !== currentSlug
      if (isChangingSlug) {
        if (Boolean(user.slugLocked)) {
          return NextResponse.json(
            { error: "Slug já foi definido e não pode mais ser alterado" },
            { status: 403 }
          )
        }

        const slugInUse = await User.findOne({
          slug: safeSlug,
          _id: { $ne: user._id },
        })
        if (slugInUse) {
          return NextResponse.json({ error: "Slug já está em uso" }, { status: 409 })
        }

        updates.slug = safeSlug
        updates.slugLocked = true
      }
    }

    if (Object.keys(updates).length > 0) {
      await User.collection.updateOne(
        { _id: user._id as never },
        {
          $set: updates,
        }
      )
    }

    const updatedUser = await User.findById(user._id as never).lean()
    return NextResponse.json({
      user: sanitizeUser((updatedUser || user) as Parameters<typeof sanitizeUser>[0]),
    })
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
