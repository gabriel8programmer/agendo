"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseCookies, setCookie } from "nookies"
import { FcGoogle } from "react-icons/fc"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
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
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans">
      <main className="w-full max-w-md">
        <Card className="p-8">
          <header className="mb-8">
            <div className="flex justify-center">
              <Image src="/logo.svg" alt="Agendo" width={180} height={52} className="h-12 w-auto" />
            </div>
            <p className="mt-1 text-center text-sm font-medium text-zinc-600 uppercase tracking-widest">
              Gerencie seus compromissos
            </p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="pt-1 text-right">
              <Link
                href="/esqueci-senha"
                className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-zinc-100" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">ou</span>
              <div className="h-px flex-1 bg-zinc-100" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full py-3"
              onClick={() => {
                window.location.href = "/api/auth/google"
              }}
            >
              <FcGoogle aria-hidden size={18} />
              Login com Google
            </Button>

            <div className="pt-6 text-center">
              <p className="text-sm font-medium text-zinc-500">Não tem uma conta?</p>
              <ButtonLink href="/cadastro" variant="secondary" className="mt-3 w-full">
                Criar Conta
              </ButtonLink>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
