"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FaEnvelope, FaChevronLeft } from "react-icons/fa"
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-6">
      <main className="w-full max-w-md">
        <Card className="border-none shadow-2xl shadow-black/5 md:p-8 p-6 rounded-[2.5rem]">
          <header className="mb-10 text-center">
            <div className="mb-6 flex justify-center">
              <Link href="/">
                <BrandLogo width={180} height={52} className="h-10 w-auto" />
              </Link>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Redefinir sua senha
            </h1>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground">
              Enviaremos um link de recuperação para o seu e-mail.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="E-mail da sua conta"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<FaEnvelope size={14} />}
              required
            />

            {error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-center text-xs font-bold text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              
              <div className="rounded-2xl bg-muted/50 p-4 border border-border">
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground">Dica:</span> Se não encontrar o e-mail em alguns minutos, verifique sua pasta de <span className="text-foreground font-bold">Spam</span> ou <span className="text-foreground font-bold">Promoções</span>.
                </p>
              </div>
            </div>

            <footer className="pt-6 text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                <FaChevronLeft size={10} />
                Voltar para o login
              </Link>
            </footer>
          </form>
        </Card>
      </main>
    </div>
  )
}
