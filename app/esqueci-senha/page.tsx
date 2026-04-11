"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ButtonLink from "@/components/ui/ButtonLink"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import BrandLogo from "@/components/ui/BrandLogo"
import { requestPasswordReset } from "@/lib/api"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await requestPasswordReset(email)
      const search = new URLSearchParams({
        requestId: result.requestId,
        email: email.trim(),
      })
      router.push(`/esqueci-senha/aguardando?${search.toString()}`)
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
              <BrandLogo width={180} height={52} className="h-12 w-auto" />
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
            {error.includes("Muitas tentativas") && (
              <p className="text-xs text-zinc-500">
                Aguarde o tempo informado para tentar novamente e evitar bloqueio temporário.
              </p>
            )}

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
