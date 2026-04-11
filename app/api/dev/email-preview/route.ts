import { NextRequest } from "next/server"
import { buildVerifyEmailTemplate } from "@/lib/email/templates/verifyEmailTemplate"

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "Cliente"
  const url =
    req.nextUrl.searchParams.get("url") ||
    "http://localhost:3000/redefinir-senha/verificar?token=exemplo"
  const assetsUrl = process.env.PUBLIC_ASSETS_URL || req.nextUrl.origin
  const logoUrl = req.nextUrl.searchParams.get("logoUrl") || `${assetsUrl}/logo-dark.svg`

  const { html } = buildVerifyEmailTemplate({
    recipientName: name,
    verifyUrl: url,
    productName: "Agendo",
    logoUrl,
  })

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}
