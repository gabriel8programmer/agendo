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
  phone?: string
  address?: string
  bio?: string
  pixKey?: string
  paymentMethods?: string[]
  createdAt?: Date | string
}) {
  return {
    id: String(user._id || ""),
    name: String(user.name || ""),
    companyName: String(user.companyName || ""),
    email: String(user.email || ""),
    slug: String(user.slug || ""),
    slugLocked: Boolean(user.slugLocked),
    phone: String(user.phone || ""),
    address: String(user.address || ""),
    bio: String(user.bio || ""),
    pixKey: String(user.pixKey || ""),
    paymentMethods: Array.isArray(user.paymentMethods) ? user.paymentMethods : ["pix", "cash"],
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
    const user = (await User.findById(payload.userId).lean()) as {
      _id: unknown
      name?: string
      companyName?: string
      email?: string
      slug?: string
      slugLocked?: boolean
      createdAt?: Date | string
      phone?: string
      address?: string
      bio?: string
      pixKey?: string
      paymentMethods?: string[]
    } | null
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const body = (await req.json()) as {
      name?: string
      companyName?: string
      slug?: string
      phone?: string
      address?: string
      bio?: string
      pixKey?: string
      paymentMethods?: string[]
    }

    const name = typeof body.name === "string" ? body.name.trim() : undefined
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : undefined
    const requestedSlugRaw = typeof body.slug === "string" ? body.slug.trim() : undefined
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined
    const address = typeof body.address === "string" ? body.address.trim() : undefined
    const bio = typeof body.bio === "string" ? body.bio.trim() : undefined
    const pixKey = typeof body.pixKey === "string" ? body.pixKey.trim() : undefined
    const paymentMethods = Array.isArray(body.paymentMethods) ? body.paymentMethods : undefined

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

    if (phone !== undefined) {
      updates.phone = phone
    }

    if (address !== undefined) {
      updates.address = address
    }

    if (bio !== undefined) {
      updates.bio = bio
    }

    if (pixKey !== undefined) {
      updates.pixKey = pixKey
    }

    if (paymentMethods !== undefined) {
      updates.paymentMethods = paymentMethods
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
