import Stripe from "stripe"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder"

export const stripe = new Stripe(stripeSecretKey, {
  appInfo: {
    name: "Agendo",
    version: "0.1.0",
  },
})

export type PlanKey = "monthly" | "annual"

export interface PlanConfig {
  id: PlanKey
  name: string
  price: number // valor formatado em Reais (ex: 24.90)
  priceCents: number // valor em centavos para Stripe (ex: 2490)
  interval: "month" | "year"
  discountPercentage?: number
  monthlyEquivalent: number // valor equivalente por mês
  description: string
  features: string[]
  recommended?: boolean
  priceId?: string
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  monthly: {
    id: "monthly",
    name: "Plano Mensal",
    price: 24.9,
    priceCents: 2490,
    interval: "month",
    monthlyEquivalent: 24.9,
    description: "Sem fidelidade, flexibilidade total para o seu negócio.",
    features: [
      "Agendamentos online ilimitados",
      "Página pública exclusiva de agendamentos",
      "Gestão de múltiplos serviços e durações",
      "Gestão de equipe e profissionais",
      "Lembretes e notificações via WhatsApp",
      "Painel com faturamento e agendamentos em tempo real",
      "Cancelamento a qualquer momento sem taxas",
    ],
    priceId: process.env.STRIPE_PRICE_MONTHLY_ID,
  },
  annual: {
    id: "annual",
    name: "Plano Anual",
    price: 268.92, // 24.90 * 12 = 298.80. 10% desconto = 268.92
    priceCents: 26892,
    interval: "year",
    discountPercentage: 10,
    monthlyEquivalent: 22.41, // 268.92 / 12 = 22.41
    recommended: true,
    description: "Economize 10% com o plano anual e garanta estabilidade para o seu ano.",
    features: [
      "Todos os recursos do Plano Mensal inclusos",
      "10% de desconto garantido no valor total",
      "Equivalente a apenas R$ 22,41 / mês",
      "Economia de quase R$ 30,00 por ano (mais de 1 mês grátis)",
      "Garantia de congelamento de preço durante 1 ano",
      "Suporte técnico prioritário",
      "Acesso antecipado a novos recursos e melhorias",
    ],
    priceId: process.env.STRIPE_PRICE_ANNUAL_ID,
  },
}
