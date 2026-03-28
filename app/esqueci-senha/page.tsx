"use client"

import { useState } from "react"
import Image from "next/image"
import ButtonLink from "@/components/ui/ButtonLink"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import { requestPasswordReset } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setSuccess("Se o email existir, enviaremos um link de verificação em instantes.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o email agora.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans">
      <main className="w-full max-w-md">
        <Card className="p-8">
          <header className="mb-8">
            <div className="flex justify-center">
              <Image src="/logo.svg" alt="Agendo" width={180} height={52} className="h-12 w-auto" />
            </div>
            <p className="mt-1 text-center text-sm font-medium text-zinc-600 uppercase tracking-widest">
              Redefinir senha
            </p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email da conta"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-emerald-700">{success}</p>}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de verificação"}
            </Button>

            <div className="pt-3 text-center">
              <ButtonLink href="/login" variant="secondary" className="w-full">
                Voltar para login
              </ButtonLink>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}

