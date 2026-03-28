import { NextResponse } from "next/server"
import { SESSION_COOKIE, SESSION_HINT_COOKIE } from "@/lib/auth"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  const secure = process.env.NODE_ENV === "production"

  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  res.cookies.set({
    name: SESSION_HINT_COOKIE,
    value: "",
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return res
}
