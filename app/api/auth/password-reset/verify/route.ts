import { NextRequest } from "next/server"
import dbConnect from "@/lib/mongoose"
import PasswordResetRequest from "@/models/PasswordResetRequest"
import { hashOpaqueToken } from "@/lib/auth"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function getAppUrl(req: NextRequest) {
  return process.env.APP_URL || req.nextUrl.origin
}

function getAssetsUrl(req: NextRequest) {
  return process.env.PUBLIC_ASSETS_URL || getAppUrl(req)
}

function buildHtml({
  title,
  message,
  logoUrl,
  ctaHref,
  ctaLabel,
}: {
  title: string
  message: string
  logoUrl: string
  ctaHref?: string
  ctaLabel?: string
}) {
  const safeTitle = escapeHtml(title)
  const safeMessage = escapeHtml(message)
  const safeLogoUrl = escapeHtml(logoUrl)
  const safeCtaHref = ctaHref ? escapeHtml(ctaHref) : ""
  const safeCtaLabel = ctaLabel ? escapeHtml(ctaLabel) : ""

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
            <tr>
              <td align="center" style="background:linear-gradient(90deg,#145a4b,#1f6d5d);padding:18px 24px;">
                <img src="${safeLogoUrl}" alt="Agendo" width="150" style="display:block;width:150px;max-width:100%;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px;">
                <h1 style="margin:0;font-size:22px;line-height:30px;font-weight:700;color:#111827;">${safeTitle}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 20px 24px;">
                <p style="margin:0;font-size:14px;line-height:22px;color:#374151;">${safeMessage}</p>
              </td>
            </tr>
            ${
              safeCtaHref && safeCtaLabel
                ? `<tr>
              <td align="center" style="padding:0 24px 24px 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius:10px;background:#1f6d5d;">
                      <a href="${safeCtaHref}" style="display:inline-block;padding:12px 20px;font-size:14px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;">
                        ${safeCtaLabel}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const appUrl = getAppUrl(req)
    const logoUrl = `${getAssetsUrl(req)}/logo-dark.svg`
    const forgotPasswordUrl = `${appUrl}/esqueci-senha`

    const token = req.nextUrl.searchParams.get("token") || ""
    if (!token) {
      return new Response(
        buildHtml({
          title: "Link inválido",
          message: "O link de verificação está incompleto ou inválido.",
          logoUrl,
          ctaHref: forgotPasswordUrl,
          ctaLabel: "Voltar para redefinição",
        }),
        { status: 400, headers: { "content-type": "text/html; charset=utf-8" } }
      )
    }

    const tokenHash = hashOpaqueToken(token)
    const resetRequest = await PasswordResetRequest.findOne({
      verifyTokenHash: tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })

    if (!resetRequest) {
      return new Response(
        buildHtml({
          title: "Link expirado",
          message: "Este link de verificação já expirou ou não é válido.",
          logoUrl,
          ctaHref: forgotPasswordUrl,
          ctaLabel: "Gerar novo link",
        }),
        { status: 400, headers: { "content-type": "text/html; charset=utf-8" } }
      )
    }

    if (!resetRequest.verifiedAt) {
      resetRequest.verifiedAt = new Date()
      await resetRequest.save()
    }

    return new Response(
      buildHtml({
        title: "Email verificado",
        message: "Pronto! Seu email foi confirmado. Continue no aplicativo para definir sua nova senha.",
        logoUrl,
      }),
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
    )
  } catch (error) {
    console.error("Erro ao verificar token de redefinição:", error)
    const appUrl = getAppUrl(req)
    return new Response(
      buildHtml({
        title: "Erro interno",
        message: "Não foi possível verificar este link agora. Tente novamente.",
        logoUrl: `${getAssetsUrl(req)}/logo-dark.svg`,
        ctaHref: `${appUrl}/esqueci-senha`,
        ctaLabel: "Tentar novamente",
      }),
      { status: 500, headers: { "content-type": "text/html; charset=utf-8" } }
    )
  }
}
