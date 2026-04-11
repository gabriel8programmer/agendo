type VerifyEmailTemplateInput = {
  verifyUrl: string
  recipientName?: string
  productName?: string
  logoUrl?: string
}

type VerifyEmailTemplateOutput = {
  subject: string
  html: string
  text: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function buildVerifyEmailTemplate({
  verifyUrl,
  recipientName,
  productName = "Agendo",
  logoUrl,
}: VerifyEmailTemplateInput): VerifyEmailTemplateOutput {
  const safeUrl = escapeHtml(verifyUrl)
  const safeProduct = escapeHtml(productName)
  const safeLogoUrl = logoUrl ? escapeHtml(logoUrl) : ""
  const greetingName = recipientName?.trim() ? `, ${escapeHtml(recipientName.trim())}` : ""
  const subject = `Confirme seu e-mail no ${productName}`

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(90deg,#145a4b,#1f6d5d);">
                  <tr>
                    <td align="center" style="padding:18px 24px 16px 24px;">
                      ${
                        safeLogoUrl
                          ? `<img src="${safeLogoUrl}" alt="${safeProduct}" width="150" style="display:block;width:150px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />`
                          : `<span style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:28px;font-weight:700;color:#ffffff;">${safeProduct}</span>`
                      }
                      <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#d1fae5;">
                        ${safeProduct}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:28px;font-weight:700;color:#111827;">
                Verifique seu e-mail
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#374151;">
                Olá${greetingName},
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 16px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#374151;">
                Clique no botão abaixo para confirmar seu e-mail e continuar no ${safeProduct}.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 24px 20px 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius:8px;background-color:#1f6d5d;">
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;">
                        Verificar e-mail
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 16px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b7280;">
                Se o botão não funcionar, copie e cole este link no navegador:
                <br />
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#145a4b;text-decoration:underline;word-break:break-all;">${safeUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b7280;">
                Se você não solicitou esta ação, pode ignorar este e-mail.
                <br />
                Se não encontrar na caixa de entrada, verifique também Spam e Promoções.
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
            <tr>
              <td align="center" style="padding:12px 8px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:#9ca3af;">
                ${safeProduct}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    "Verifique seu e-mail",
    "",
    `Olá${recipientName?.trim() ? `, ${recipientName.trim()}` : ""}.`,
    `Acesse o link para confirmar seu e-mail no ${productName}:`,
    verifyUrl,
    "",
    "Se você não solicitou esta ação, pode ignorar este e-mail.",
    "Se não encontrar na caixa de entrada, verifique também Spam e Promoções.",
  ].join("\n")

  return {
    subject,
    html,
    text,
  }
}
