"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseCookies, setCookie } from "nookies"
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
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
              Crie sua conta
            </h1>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground">
              Comece a gerir seus agendamentos hoje mesmo.
            </p>
          </header>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Nome"
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<FaUser size={14} />}
                required
              />

              <Input
                label="E-mail"
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

              <Input
                label="Senha"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<FaLock size={14} />}
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
                icon={<FaLock size={14} />}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-center text-xs font-bold text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Minha Conta"}
            </Button>

            <footer className="pt-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">Já tem uma conta?</p>
              <Link href="/login" className="mt-2 inline-block text-sm font-bold text-primary hover:underline">
                Acesse sua conta aqui
              </Link>
            </footer>
          </form>
        </Card>
      </main>
    </div>
  )
}
