import { NextRequest } from "next/server"
import dbConnect from "@/lib/mongoose"
import PasswordResetRequest from "@/models/PasswordResetRequest"
import { hashOpaqueToken } from "@/lib/auth"

function buildHtml(title: string, message: string) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:32px;color:#111827;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
      <h1 style="font-size:20px;line-height:28px;margin:0 0 10px;">${title}</h1>
      <p style="font-size:14px;line-height:22px;margin:0;color:#374151;">${message}</p>
    </div>
  </body>
</html>`
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.nextUrl.searchParams.get("token") || ""
    if (!token) {
      return new Response(
        buildHtml("Link inválido", "O link de verificação está incompleto ou inválido."),
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
        buildHtml("Link expirado", "Este link de verificação já expirou ou não é válido."),
        { status: 400, headers: { "content-type": "text/html; charset=utf-8" } }
      )
    }

    if (!resetRequest.verifiedAt) {
      resetRequest.verifiedAt = new Date()
      await resetRequest.save()
    }

    return new Response(
      buildHtml("Email verificado", "Pronto! Você já pode voltar ao aplicativo e redefinir sua senha."),
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
    )
  } catch (error) {
    console.error("Erro ao verificar token de redefinição:", error)
    return new Response(
      buildHtml("Erro interno", "Não foi possível verificar este link agora. Tente novamente."),
      { status: 500, headers: { "content-type": "text/html; charset=utf-8" } }
    )
  }
}

