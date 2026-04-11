"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { parseCookies, setCookie } from "nookies"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import BrandLogo from "@/components/ui/BrandLogo"
import { useAuth } from "@/components/providers/AuthProvider"
import { registerWithEmail } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const cookies = parseCookies()
    if (cookies.agendo_logged === "1") {
      router.replace("/dashboard")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas não conferem")
      return
    }

    setLoading(true)
    try {
      await registerWithEmail({ name, email, password })
      setCookie(null, "agendo_logged", "1", {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
      await refreshUser()
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta")
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
              Crie sua conta
            </p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Nome"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Senha"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirmar Senha"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>

            <div className="pt-3 text-center">
              <p className="text-sm font-medium text-zinc-500">Já tem uma conta?</p>
              <ButtonLink href="/login" variant="secondary" className="mt-3 w-full">
                Entrar
              </ButtonLink>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
