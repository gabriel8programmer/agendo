import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE = "agendo_session"

const protectedPaths = ["/dashboard", "/agenda", "/servicos", "/configuracoes"]
const publicAuthPaths = ["/login", "/cadastro"]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value)

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  const isAuthPage = publicAuthPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage && hasSession) {
    const dashboardUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agenda/:path*",
    "/servicos/:path*",
    "/configuracoes/:path*",
    "/login",
    "/cadastro",
  ],
}

