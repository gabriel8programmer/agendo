import type { Metadata } from "next"
import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaClock,
  FaMoneyBillWave,
  FaUser,
  FaWrench,
} from "react-icons/fa"

import ButtonLink from "@/components/ui/ButtonLink"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Resumo da sua agenda",
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      <Header />
      <main className="mx-auto w-full max-w-2xl p-4">
        <Card className="p-6">
          <header className="mb-6">
            <p className="text-sm font-medium text-zinc-600 uppercase tracking-widest">
              Resumo do dia
            </p>
            <h1 className="text-xl font-bold text-zinc-900">Bom dia, João</h1>
          </header>

          <section className="mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <FaCalendarCheck className="text-zinc-900" aria-hidden />
                  <h2 className="text-sm font-medium text-zinc-700">Agendamentos hoje</h2>
                </div>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">3</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <FaClock className="text-zinc-900" aria-hidden />
                  <h2 className="text-sm font-medium text-zinc-700">Próximo atendimento</h2>
                </div>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">14:30</p>
              </Card>

              <Card className="p-4 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-zinc-900" aria-hidden />
                  <h2 className="text-sm font-medium text-zinc-700">Faturamento hoje</h2>
                </div>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">R$ 1.200,00</p>
              </Card>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-sm font-medium text-zinc-700 uppercase tracking-wider">
              Próximos atendimentos
            </h2>

            <ul className="space-y-3">
              <li className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-zinc-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-200">
                    <FaUser className="text-zinc-400" aria-hidden />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Maria Silva</div>
                    <div className="text-sm text-zinc-600 font-medium">Corte + Barba</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-zinc-900">09:00</div>
              </li>

              <li className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-zinc-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-200">
                    <FaUser className="text-zinc-400" aria-hidden />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Carlos Oliveira</div>
                    <div className="text-sm text-zinc-600 font-medium">Barba</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-zinc-900">11:30</div>
              </li>

              <li className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-zinc-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-200">
                    <FaUser className="text-zinc-400" aria-hidden />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">João Santos</div>
                    <div className="text-sm text-zinc-600 font-medium">Corte</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-zinc-900">14:30</div>
              </li>
            </ul>
          </section>

          <section>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ButtonLink href="/agenda" variant="primary">
                <FaCalendarAlt aria-hidden />
                Ver agenda
              </ButtonLink>
              <ButtonLink href="/servicos" variant="secondary">
                <FaWrench aria-hidden />
                Gerenciar serviços
              </ButtonLink>
            </div>
          </section>
        </Card>
      </main>
    </div>
  )
}
