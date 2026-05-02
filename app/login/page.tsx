"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseCookies, setCookie } from "nookies"
import { FcGoogle } from "react-icons/fc"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import BrandLogo from "@/components/ui/BrandLogo"
import { useAuth } from "@/components/providers/AuthProvider"
import { loginWithEmail } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const cookies = parseCookies()
    if (cookies.agendo_logged === "1") {
      router.replace("/dashboard")
    }
  }, [router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get("error")
    if (oauthError) {
      setError("Não foi possível autenticar com Google. Tente novamente.")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await loginWithEmail({ email, password })
      setCookie(null, "agendo_logged", "1", {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
      await refreshUser()
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-6">
      <main className="w-full max-w-sm">
        <Card className="border-none shadow-2xl shadow-black/5 md:p-8 p-6 rounded-[2.5rem]">
          <header className="mb-10 text-center">
            <div className="mb-6 flex justify-center">
              <Link href="/">
                <BrandLogo width={180} height={52} className="h-10 w-auto" />
              </Link>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Acesse sua conta
            </h1>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground">
              Bem-vindo de volta!
            </p>
          </header>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="E-mail"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="space-y-1">
                <Input
                  label="Senha"
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="flex justify-end">
                  <Link
                    href="/esqueci-senha"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-center text-xs font-bold text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full text-sm font-bold"
              onClick={() => {
                window.location.href = "/api/auth/google"
              }}
            >
              <FcGoogle aria-hidden size={20} />
              Entrar com Google
            </Button>

            <footer className="pt-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">Ainda não tem conta?</p>
              <Link href="/cadastro" className="mt-2 inline-block text-sm font-bold text-primary hover:underline">
                Crie sua conta gratuitamente
              </Link>
            </footer>
          </form>
        </Card>
      </main>
    </div>
  )
}
