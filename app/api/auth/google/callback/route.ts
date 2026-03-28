import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { createSessionToken, SESSION_COOKIE, SESSION_HINT_COOKIE, toSafeSlug } from "@/lib/auth"

const OAUTH_STATE_COOKIE = "agendo_oauth_state"

type GoogleTokenResponse = {
  access_token?: string
}

type GoogleUserInfo = {
  email?: string
  name?: string
}

function getAppUrl(req: NextRequest) {
  return process.env.APP_URL || req.nextUrl.origin
}

function loginRedirect(req: NextRequest, error: string) {
  const url = new URL("/login", getAppUrl(req))
  url.searchParams.set("error", error)
  return url
}

async function getUniqueSlug(baseName: string) {
  const baseSlug = toSafeSlug(baseName) || "usuario"
  let slug = baseSlug
  let suffix = 1
  while (await User.findOne({ slug })) {
    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }
  return slug
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(loginRedirect(req, "google_config"))
  }

  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(loginRedirect(req, "google_state_invalid"))
  }

  const redirectUri = `${getAppUrl(req)}/api/auth/google/callback`
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(loginRedirect(req, "google_token"))
  }

  const tokenData = (await tokenRes.json()) as GoogleTokenResponse
  if (!tokenData.access_token) {
    return NextResponse.redirect(loginRedirect(req, "google_token"))
  }

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  })

  if (!profileRes.ok) {
    return NextResponse.redirect(loginRedirect(req, "google_profile"))
  }

  const profile = (await profileRes.json()) as GoogleUserInfo
  const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : ""
  const name = typeof profile.name === "string" ? profile.name.trim() : ""

  if (!email) {
    return NextResponse.redirect(loginRedirect(req, "google_email"))
  }

  await dbConnect()

  let user = await User.findOne({ email })
  if (!user) {
    const safeName = name || email.split("@")[0] || "Usuário"
    const slug = await getUniqueSlug(safeName)
    user = await User.create({
      name: safeName,
      companyName: safeName,
      email,
      slug,
      slugLocked: false,
    })
    await User.collection.updateOne(
      { _id: user._id as never },
      {
        $set: {
          companyName: safeName,
          slugLocked: false,
        },
      }
    )
  } else if (!user.companyName || !String(user.companyName).trim()) {
    await User.collection.updateOne(
      { _id: user._id as never },
      {
        $set: {
          companyName: user.name || name || email.split("@")[0] || "Usuário",
        },
      }
    )
  }

  const token = createSessionToken({
    userId: String(user._id),
    email: String(user.email || email),
    name: String(user.name || name || "Usuário"),
  })

  const dashboardUrl = new URL("/dashboard", getAppUrl(req))
  const res = NextResponse.redirect(dashboardUrl)
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
  res.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return res
}
