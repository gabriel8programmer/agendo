"use client"

import { useEffect, useRef, useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import BrandLogo from "@/components/ui/BrandLogo"
import { confirmPasswordReset, getPasswordResetStatus } from "@/lib/api"

type ResetStatus = "pending" | "verified" | "used" | "expired" | "not_found"

export default function WaitForVerificationPage() {
  const [requestId, setRequestId] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<ResetStatus>("pending")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rid = params.get("requestId") || ""
    const userEmail = params.get("email") || ""

    if (!rid) {
      setError("Solicitação inválida. Volte e tente novamente.")
      setLoading(false)
      return
    }

    setRequestId(rid)
    setEmail(userEmail)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!requestId) return

    const checkStatus = async () => {
      try {
        const data = await getPasswordResetStatus(requestId)
        setStatus(data.status)

        if (data.status !== "pending" && intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } catch {
        // mantém polling, sem quebrar UX por falha transitória
      }
    }

    checkStatus()
    intervalRef.current = setInterval(checkStatus, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [requestId])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!requestId) {
      setError("Solicitação inválida.")
      return
    }

    setSubmitting(true)
    try {
      await confirmPasswordReset({
        requestId,
        password,
        confirmPassword,
      })
      setMessage("Senha redefinida com sucesso. Você já pode fazer login.")
      setPassword("")
      setConfirmPassword("")
      setStatus("used")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível redefinir a senha.")
    } finally {
      setSubmitting(false)
    }
  }

  const showResetForm = status === "verified"
  const isFinalState = status === "used" || status === "expired" || status === "not_found"

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans">
      <main className="w-full max-w-md">
        <Card className="p-8">
          <header className="mb-8">
            <div className="flex justify-center">
              <BrandLogo width={180} height={52} className="h-12 w-auto" />
            </div>
            <p className="mt-1 text-center text-sm font-medium text-zinc-600 uppercase tracking-widest">
              Verificação de email
            </p>
          </header>

          {loading ? (
            <p className="text-sm text-zinc-500 text-center">Carregando...</p>
          ) : (
            <div className="space-y-4">
              {!showResetForm && !isFinalState && (
                <>
                  <p className="text-sm text-zinc-700">
                    Enviamos um link de verificação para <strong>{email || "seu email"}</strong>.
                  </p>
                  <p className="text-sm text-zinc-600">
                    Assim que você clicar no link, esta página libera automaticamente o formulário
                    de nova senha.
                  </p>
                  <p className="text-xs text-zinc-500">Verificando status a cada 5 segundos...</p>
                </>
              )}

              {showResetForm && (
                <form className="space-y-4" onSubmit={handleConfirm}>
                  <p className="text-sm text-emerald-700 font-medium">
                    Email verificado! Defina sua nova senha.
                  </p>

                  <Input
                    label="Nova senha"
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <Input
                    label="Confirmar nova senha"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <Button type="submit" className="w-full py-3" disabled={submitting}>
                    {submitting ? "Salvando..." : "Redefinir senha"}
                  </Button>
                </form>
              )}

              {status === "expired" && (
                <p className="text-sm text-amber-700">
                  A solicitação expirou. Gere um novo link de redefinição.
                </p>
              )}
              {status === "not_found" && (
                <p className="text-sm text-red-600">Solicitação não encontrada.</p>
              )}
              {status === "used" && (
                <p className="text-sm text-emerald-700">
                  Esta solicitação já foi utilizada com sucesso.
                </p>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
              {message && <p className="text-sm text-emerald-700">{message}</p>}

              <ButtonLink href="/login" variant="secondary" className="w-full">
                Voltar para login
              </ButtonLink>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
