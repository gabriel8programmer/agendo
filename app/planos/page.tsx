"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FaCheckCircle,
  FaShieldAlt,
  FaBolt,
  FaQrcode,
  FaCreditCard,
  FaArrowLeft,
  FaStar,
} from "react-icons/fa"
import BrandLogo from "@/components/ui/BrandLogo"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import { useAuth } from "@/components/providers/AuthProvider"
import { createCheckoutSession, createCustomerPortalSession } from "@/lib/api"
import { PLANS } from "@/lib/stripe"

export default function PlansPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubscribe = async (plan: "monthly" | "annual", mode: "payment" | "subscription") => {
    setErrorMessage(null)

    if (!user && !authLoading) {
      router.push(`/cadastro?redirect=/planos&plan=${plan}`)
      return
    }

    setLoadingPlan(`${plan}-${mode}`)
    try {
      const response = await createCheckoutSession({ plan, mode })
      if (response.url) {
        window.location.href = response.url
      } else {
        throw new Error("URL de checkout não recebida")
      }
    } catch (err: unknown) {
      console.error("Erro ao iniciar assinatura:", err)
      const message =
        err instanceof Error ? err.message : "Erro ao conectar com o provedor de pagamentos."
      setErrorMessage(message)
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleOpenPortal = async () => {
    setLoadingPlan("portal")
    try {
      const response = await createCustomerPortalSession()
      if (response.url) {
        window.location.href = response.url
      }
    } catch (err) {
      console.error("Erro ao abrir portal:", err)
      setErrorMessage("Não foi possível abrir o portal de gerenciamento.")
    } finally {
      setLoadingPlan(null)
    }
  }

  const isCurrentPlanActive = user?.subscriptionStatus === "active"

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      {user ? (
        <Header />
      ) : (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="transition-opacity hover:opacity-80">
              <BrandLogo width={120} height={34} className="h-7 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Criar Conta Grátis
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-5xl px-4 pt-10 md:pt-14">
        <div className="mb-4">
          <Link
            href={user ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaArrowLeft size={12} />
            {user ? "Voltar ao Dashboard" : "Voltar à Página Inicial"}
          </Link>
        </div>

        {/* Hero Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
            <FaBolt className="text-primary" />
            Planos Comerciais Transparentes
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Escolha o plano ideal para <br className="hidden sm:inline" />
            fazer seu negócio crescer
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-muted-foreground sm:text-lg">
            Sem contratos abusivos. Todos os recursos inclusos: agendamentos ilimitados, página
            pública exclusiva, notificações por WhatsApp e muito mais.
          </p>
        </div>

        {/* Current Subscription Notice */}
        {isCurrentPlanActive && (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
            <div className="flex items-center justify-center gap-2 font-bold text-emerald-600">
              <FaCheckCircle />
              Sua assinatura ({user.subscriptionPlan === "annual" ? "Plano Anual" : "Plano Mensal"})
              está ativa!
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Você já tem acesso completo a todas as ferramentas do Agendo.
            </p>
            {user.stripeCustomerId && (
              <button
                type="button"
                onClick={handleOpenPortal}
                disabled={loadingPlan === "portal"}
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                {loadingPlan === "portal" ? "Carregando..." : "Gerenciar Assinatura / Ver Faturas"}
              </button>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center text-sm font-medium text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="mt-10 flex justify-center">
          <div className="relative inline-flex items-center rounded-2xl border border-border bg-card p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`relative rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                billingCycle === "annual"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Anual</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  billingCycle === "annual"
                    ? "bg-amber-400 text-black"
                    : "bg-primary/20 text-primary"
                }`}
              >
                10% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-8">
          {/* Plano Mensal */}
          <Card
            className={`relative flex flex-col justify-between p-6 sm:p-8 transition-all hover:shadow-xl ${
              billingCycle === "monthly"
                ? "border-2 border-primary ring-2 ring-primary/10 shadow-lg"
                : "border-border opacity-95"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">{PLANS.monthly.name}</h3>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  Flexível
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{PLANS.monthly.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground">R$</span>
                <span className="text-5xl font-black tracking-tight text-foreground">24</span>
                <span className="text-2xl font-black text-foreground">,90</span>
                <span className="text-sm font-semibold text-muted-foreground">/ mês</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cobrado mensalmente • Sem fidelidade ou carência
              </p>

              <div className="my-6 h-px bg-border" />

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  O que está incluso:
                </p>
                {PLANS.monthly.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" size={16} />
                    <span className="text-sm font-medium text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-2.5">
              <Button
                variant="primary"
                className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2"
                disabled={loadingPlan !== null}
                onClick={() => handleSubscribe("monthly", "subscription")}
              >
                <FaCreditCard size={15} />
                {loadingPlan === "monthly-subscription"
                  ? "Iniciando..."
                  : "Assinar Mensal no Cartão"}
              </Button>

              <Button
                variant="secondary"
                className="w-full h-11 text-xs font-semibold flex items-center justify-center gap-2"
                disabled={loadingPlan !== null}
                onClick={() => handleSubscribe("monthly", "payment")}
              >
                <FaQrcode size={14} className="text-emerald-500" />
                {loadingPlan === "monthly-payment"
                  ? "Iniciando..."
                  : "Pagar 1 Mês no Pix ou Cartão"}
              </Button>
            </div>
          </Card>

          {/* Plano Anual */}
          <Card
            className={`relative flex flex-col justify-between p-6 sm:p-8 transition-all hover:shadow-xl ${
              billingCycle === "annual"
                ? "border-2 border-primary ring-4 ring-primary/10 shadow-2xl bg-gradient-to-b from-primary/[0.03] to-transparent"
                : "border-border"
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-foreground">{PLANS.annual.name}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-sm">
                    <FaStar size={11} className="text-amber-300" />
                    Recomendado • 10% OFF
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-600">
                    Mais de 1 Mês Grátis
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{PLANS.annual.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground">R$</span>
                <span className="text-5xl font-black tracking-tight text-foreground">22</span>
                <span className="text-2xl font-black text-foreground">,41</span>
                <span className="text-sm font-semibold text-muted-foreground">/ mês</span>
              </div>

              <p className="mt-1 text-xs font-medium text-emerald-600">
                Total de R$ 268,92 cobrados ao ano (economia de R$ 29,88)
              </p>

              <div className="my-6 h-px bg-border" />

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tudo do mensal e mais vantagens:
                </p>
                {PLANS.annual.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <FaCheckCircle className="mt-0.5 shrink-0 text-primary" size={16} />
                    <span className="text-sm font-medium text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-2.5">
              <Button
                variant="primary"
                className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                disabled={loadingPlan !== null}
                onClick={() => handleSubscribe("annual", "subscription")}
              >
                <FaCreditCard size={15} />
                {loadingPlan === "annual-subscription"
                  ? "Iniciando..."
                  : "Assinar Anual com 10% OFF"}
              </Button>

              <Button
                variant="secondary"
                className="w-full h-11 text-xs font-semibold flex items-center justify-center gap-2"
                disabled={loadingPlan !== null}
                onClick={() => handleSubscribe("annual", "payment")}
              >
                <FaQrcode size={14} className="text-emerald-500" />
                {loadingPlan === "annual-payment"
                  ? "Iniciando..."
                  : "Pagar Anual com Pix ou Cartão à Vista"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Security and Payment methods banner */}
        <section className="mt-16 rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                <FaQrcode size={24} />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Pix Instantâneo</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Ativação na hora via QR Code ou código copia e cola Stripe.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <FaCreditCard size={24} />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Cartões de Crédito & Débito</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Visa, Mastercard, Elo, Hipercard e American Express.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
                <FaShieldAlt size={24} />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Segurança Stripe</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Criptografia de ponta e conformidade PCI DSS Nível 1.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-16 mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Perguntas Frequentes
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tire todas as suas dúvidas sobre a assinatura e pagamentos
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-foreground">
                Como funciona o teste de pagamentos no Stripe?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                O Stripe oferece um ambiente de testes completo. Para cartões, você pode utilizar
                números de teste como{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  4242 4242 4242 4242
                </code>
                . Para Pix, a página do Stripe Checkout exibe um botão de simulação para aprovar o
                pagamento instantaneamente sem gastar nenhum centavo real.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-foreground">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Sim! Não há multas, fidelidade ou taxas de cancelamento. Você pode gerenciar ou
                cancelar sua assinatura com um clique diretamente pelo portal do cliente Stripe em
                suas configurações.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-foreground">
                Como funciona o desconto do Plano Anual?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                O plano mensal custa R$ 24,90/mês (totalizando R$ 298,80 ao ano). No plano anual,
                você tem 10% de desconto direto, pagando apenas R$ 268,92 (equivalente a R$
                22,41/mês). Você ganha mais de 1 mês inteiramente grátis.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-foreground">
                O que acontece após o pagamento?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Assim que a confirmação é recebida pelo webhook da Stripe (seja no cartão ou no
                Pix), sua conta é atualizada imediatamente para o status Ativo, liberando todos os
                recursos da plataforma.
              </p>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
