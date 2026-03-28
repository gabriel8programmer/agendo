import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const OAUTH_STATE_COOKIE = "agendo_oauth_state"

function getAppUrl(req: NextRequest) {
  return process.env.APP_URL || req.nextUrl.origin
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID não configurado" }, { status: 500 })
  }

  const state = crypto.randomBytes(24).toString("hex")
  const redirectUri = `${getAppUrl(req)}/api/auth/google/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  })

  const res = NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`)
  const secure = process.env.NODE_ENV === "production"
  res.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })

  return res
}
