"use client"

import { useState, useEffect, useMemo } from "react"
import {
  FaUsers,
  FaSearch,
  FaWhatsapp,
  FaCalendarCheck,
  FaExclamationTriangle,
  FaUserCheck,
  FaUserClock,
} from "react-icons/fa"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import ButtonLink from "@/components/ui/ButtonLink"
import { useAuth } from "@/components/providers/AuthProvider"
import { useToast } from "@/components/ui/Toast"
import { getClients } from "@/lib/api"
import { ClientSummary } from "@/types"
import { dayjs } from "@/lib/utils/date"

function formatPhoneDisplay(phone?: string): string {
  if (!phone) return "Sem WhatsApp"
  const digits = phone.replace(/\D/g, "")
  const local = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  return phone
}

function buildRecoveryWhatsAppUrl(
  client: ClientSummary,
  barbershopName: string,
  slug?: string
): string | null {
  if (!client.whatsapp) return null
  const digits = client.whatsapp.replace(/\D/g, "")
  if (!digits) return null
  const normalized = digits.startsWith("55") ? digits : `55${digits}`

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://agendo-one.vercel.app"
  const bookingLink = slug ? `${origin}/${slug}` : ""

  const firstName = client.name.trim().split(" ")[0]
  let message = ""

  if (client.status === "warning") {
    message =
      `Fala, ${firstName}! Tudo bem? 💈\n\n` +
      `Passando para lembrar que faz cerca de ${client.daysSinceLastVisit} dias desde seu último atendimento aqui na *${barbershopName}*.\n\n` +
      `Bora renovar o visual para o fim de semana?\n` +
      (bookingLink ? `Você pode escolher seu horário direto por aqui: ${bookingLink}\n\n` : "") +
      `Qualquer dúvida, estamos por aqui!`
  } else if (client.status === "inactive") {
    message =
      `Fala, ${firstName}! Tudo bem? Sumiu por aqui! 💈\n\n` +
      `Já faz mais de ${client.daysSinceLastVisit} dias desde a sua última visita à *${barbershopName}*.\n\n` +
      `Estamos com a agenda aberta para os próximos dias. Bora agendar?\n` +
      (bookingLink ? `Escolha o melhor dia e horário por aqui: ${bookingLink}\n\n` : "") +
      `Te esperamos!`
  } else if (client.status === "upcoming") {
    message =
      `Olá, ${firstName}! Tudo bem? 💈\n\n` +
      `Passando para confirmar que seu agendamento aqui na *${barbershopName}* está confirmado!\n\n` +
      `Qualquer dúvida ou alteração, é só me mandar mensagem por aqui. Até breve!`
  } else {
    message =
      `Fala, ${firstName}! Tudo bem? 💈\n\n` +
      `Passando da *${barbershopName}* para agradecer pela preferência!\n\n` +
      `Quando quiser garantir o próximo horário, é só acessar: ${bookingLink || "nosso link"}.\n` +
      `Um abraço!`
  }

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export default function ClientesPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast, ToastComponent } = useToast()

  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "warning" | "inactive" | "active" | "upcoming"
  >("all")

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setClients([])
      setLoading(false)
      return
    }

    async function loadData() {
      setLoading(true)
      try {
        const data = await getClients(user?.id)
        setClients(data)
      } catch (err) {
        console.error("Erro ao carregar clientes:", err)
        showToast("Não foi possível carregar a lista de clientes.", "error")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authLoading, user?.id, showToast])

  const barbershopName = user?.companyName || user?.name || "Barbearia"

  // Contadores
  const stats = useMemo(() => {
    const total = clients.length
    const warning = clients.filter((c) => c.status === "warning").length
    const inactive = clients.filter((c) => c.status === "inactive").length
    const active = clients.filter((c) => c.status === "active").length
    const upcoming = clients.filter((c) => c.status === "upcoming").length
    return { total, warning, inactive, active, upcoming, toRecover: warning + inactive }
  }, [clients])

  // Filtragem e busca
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        !searchTerm.trim() ||
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.whatsapp && client.whatsapp.includes(searchTerm.trim()))

      if (!matchesSearch) return false

      if (selectedFilter === "all") return true
      return client.status === selectedFilter
    })
  }, [clients, searchTerm, selectedFilter])

  return (
    <div className="min-h-screen bg-background pb-24 font-sans md:pb-12">
      <Header />
      <main className="mx-auto max-w-4xl p-4 md:p-8">
        <header className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                Gestão de Clientes
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                Base de Clientes & CRM
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Monitore a frequência dos seus clientes e reative quem está sumido pelo WhatsApp.
              </p>
            </div>
            <ButtonLink href="/agenda" variant="secondary" className="self-start md:self-auto">
              <FaCalendarCheck className="text-primary" />
              Abrir Agenda
            </ButtonLink>
          </div>
        </header>

        {/* Cards de Métricas do CRM */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FaUsers size={12} className="text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-black text-foreground">{loading ? "..." : stats.total}</p>
          </Card>

          <Card
            className={`p-4 transition-colors ${
              stats.warning > 0 ? "border-amber-500/30 bg-amber-500/5" : ""
            }`}
          >
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <FaUserClock size={12} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Hora de Voltar</span>
            </div>
            <p className="text-2xl font-black text-amber-600">{loading ? "..." : stats.warning}</p>
          </Card>

          <Card
            className={`p-4 transition-colors ${
              stats.inactive > 0 ? "border-rose-500/30 bg-rose-500/5" : ""
            }`}
          >
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <FaExclamationTriangle size={12} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Sumidos</span>
            </div>
            <p className="text-2xl font-black text-rose-600">{loading ? "..." : stats.inactive}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <FaUserCheck size={12} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Em Dia</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">{loading ? "..." : stats.active}</p>
          </Card>
        </section>

        {/* Barra de Busca e Filtros */}
        <section className="mb-6 space-y-3">
          <Input
            id="searchClients"
            placeholder="Buscar por nome ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<FaSearch size={14} />}
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Todos</span>
              <span className="rounded-full bg-background/50 px-1.5 py-0.2 text-[10px] font-black">
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("warning")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedFilter === "warning"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>⚠️ Hora de Voltar</span>
              <span className="rounded-full bg-background/50 px-1.5 py-0.2 text-[10px] font-black">
                {stats.warning}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("inactive")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedFilter === "inactive"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>🚨 Sumidos (+40 dias)</span>
              <span className="rounded-full bg-background/50 px-1.5 py-0.2 text-[10px] font-black">
                {stats.inactive}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("active")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedFilter === "active"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>✅ Em Dia</span>
              <span className="rounded-full bg-background/50 px-1.5 py-0.2 text-[10px] font-black">
                {stats.active}
              </span>
            </button>

            {stats.upcoming > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFilter("upcoming")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedFilter === "upcoming"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>📅 Agendados</span>
                <span className="rounded-full bg-background/50 px-1.5 py-0.2 text-[10px] font-black">
                  {stats.upcoming}
                </span>
              </button>
            )}
          </div>
        </section>

        {/* Lista de Clientes */}
        <section>
          {loading || authLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                <FaUsers size={32} />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {clients.length === 0
                  ? "Nenhum cliente cadastrado ainda"
                  : "Nenhum cliente encontrado com esse filtro"}
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                {clients.length === 0
                  ? "Assim que os primeiros agendamentos forem realizados pela página pública ou encaixe de balcão, seus clientes aparecerão aqui automaticamente."
                  : "Tente buscar por outro termo ou selecione a opção 'Todos' para ver a lista completa."}
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {filteredClients.map((client) => {
                const whatsappUrl = buildRecoveryWhatsAppUrl(client, barbershopName, user?.slug)
                const lastDate = dayjs(client.lastAppointmentDate).tz("America/Sao_Paulo")

                return (
                  <li
                    key={client.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar com inicial */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-lg">
                        {client.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-foreground text-base truncate">
                            {client.name}
                          </h3>

                          {/* Status Badge */}
                          {client.status === "warning" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-600">
                              Hora de voltar ({client.daysSinceLastVisit} dias)
                            </span>
                          )}
                          {client.status === "inactive" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600">
                              Sumido ({client.daysSinceLastVisit} dias)
                            </span>
                          )}
                          {client.status === "active" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                              Em dia ({client.daysSinceLastVisit}d atrás)
                            </span>
                          )}
                          {client.status === "upcoming" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-600">
                              Agendado
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                          <span>{formatPhoneDisplay(client.whatsapp)}</span>
                          <span>•</span>
                          <span>
                            {client.totalAppointments === 1
                              ? "1 visita"
                              : `${client.totalAppointments} visitas`}
                          </span>
                          <span>•</span>
                          <span>
                            Último: {client.lastServiceName} em {lastDate.format("DD/MM/YYYY")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Resgate no WhatsApp */}
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer ${
                          client.status === "warning" || client.status === "inactive"
                            ? "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95"
                            : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                        }`}
                      >
                        <FaWhatsapp size={16} />
                        <span>
                          {client.status === "warning" || client.status === "inactive"
                            ? "Resgatar no WhatsApp"
                            : "Enviar Mensagem"}
                        </span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic self-end sm:self-center">
                        Sem WhatsApp
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>

      {ToastComponent}
    </div>
  )
}
