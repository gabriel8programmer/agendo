"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { FaCheck, FaLock, FaHourglassHalf, FaExclamationTriangle, FaChevronLeft } from "react-icons/fa"
import Button from "@/components/ui/Button"
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
        // mantém polling
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
              {showResetForm ? "Nova senha" : "Verificação de E-mail"}
            </h1>
          </header>

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground font-bold text-sm text-center">Carregando...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {!showResetForm && !isFinalState && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
                    <FaHourglassHalf size={24} className="animate-pulse" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-[15px] font-medium text-foreground">
                      Enviamos um link para <span className="font-bold">{email || "seu e-mail"}</span>.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Clique no link recebido para desbloquear a redefinição de senha nesta página.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-muted/50 p-4 border border-border text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Aguardando confirmação...
                    </p>
                  </div>
                </div>
              )}

              {showResetForm && (
                <form className="space-y-5 animate-in slide-in-from-bottom-4 duration-500" onSubmit={handleConfirm}>
                  <div className="rounded-xl bg-primary/5 p-4 border border-primary/20 text-center">
                    <p className="text-xs font-bold text-primary">
                      E-mail verificado! Digite sua nova senha abaixo.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Nova senha"
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
                      label="Confirmar nova senha"
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

                  <Button type="submit" className="h-12 w-full text-base" disabled={submitting}>
                    {submitting ? "Salvando..." : "Redefinir Senha"}
                  </Button>
                </form>
              )}

              {isFinalState && (
                <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
                  {status === "used" && (
                    <>
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
                        <FaCheck size={32} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-foreground">Sucesso!</h3>
                        <p className="text-sm text-muted-foreground">Sua senha foi atualizada. Você já pode acessar sua conta.</p>
                      </div>
                    </>
                  )}
                  {status === "expired" && (
                    <>
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-destructive/10 text-destructive">
                        <FaExclamationTriangle size={32} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-foreground">Link Expirado</h3>
                        <p className="text-sm text-muted-foreground">Este link de recuperação não é mais válido. Gere um novo para continuar.</p>
                      </div>
                    </>
                  )}
                  {(status === "not_found") && (
                    <>
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-destructive/10 text-destructive">
                        <FaExclamationTriangle size={32} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-foreground">Erro</h3>
                        <p className="text-sm text-muted-foreground">Solicitação não encontrada ou inválida.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-destructive/10 p-3 text-center text-xs font-bold text-destructive animate-in fade-in duration-300">
                  {error}
                </div>
              )}

              <footer className="pt-6 text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <FaChevronLeft size={10} />
                  Voltar para o login
                </Link>
              </footer>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
