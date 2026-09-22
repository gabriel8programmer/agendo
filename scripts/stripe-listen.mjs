import fs from "node:fs"
import { spawn } from "node:child_process"

try {
  const envContent = fs.readFileSync(".env", "utf8")
  const match = envContent.match(/STRIPE_SECRET_KEY=([^\r\n]+)/)
  if (!match) {
    console.error("Erro: STRIPE_SECRET_KEY não encontrado no arquivo .env")
    process.exit(1)
  }

  const apiKey = match[1].trim()
  const child = spawn(
    "stripe",
    [
      "listen",
      "--api-key",
      apiKey,
      "--all-snapshot",
      "--forward-to",
      "localhost:3003/api/webhooks/stripe",
    ],
    { stdio: "inherit" }
  )

  child.on("close", (code) => {
    process.exit(code ?? 0)
  })
} catch (err) {
  console.error("Erro ao iniciar stripe listen:", err)
  process.exit(1)
}
