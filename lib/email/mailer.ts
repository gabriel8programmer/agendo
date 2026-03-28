import nodemailer, { Transporter } from "nodemailer"

type MailPayload = {
  to: string
  subject: string
  html: string
  text: string
}

let transporter: Transporter | null = null

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`)
  }
  return value
}

function getTransporter() {
  if (transporter) return transporter

  const host = getRequiredEnv("SMTP_HOST")
  const port = Number(getRequiredEnv("SMTP_PORT"))
  const user = getRequiredEnv("SMTP_USER")
  const pass = getRequiredEnv("SMTP_PASS")

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  return transporter
}

export async function sendEmail(payload: MailPayload) {
  const from = getRequiredEnv("SMTP_FROM")
  const mailer = getTransporter()

  await mailer.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

