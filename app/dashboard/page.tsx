"use client"

import { useState, useEffect, useMemo } from "react"
import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaClock,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaUserTie,
  FaUser,
  FaWhatsapp,
  FaWrench,
} from "react-icons/fa"

import Link from "next/link"
import ButtonLink from "@/components/ui/ButtonLink"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import { useAuth } from "@/components/providers/AuthProvider"
import { getAppointments, getAvailability, getServices } from "@/lib/api"
import { Appointment, Availability, Service } from "@/types"
import { formatToLocalTime, getTodayDate, dayjs } from "@/lib/utils/date"

function parseTimeToMinutes(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
  if (!match) return -1
  return Number(match[1]) * 60 + Number(match[2])
}

function hasValidAvailability(availability: Availability | null): boolean {
  if (!availability) return false
  if (!Array.isArray(availability.workDays) || availability.workDays.length === 0) return false
  if (!Number.isFinite(availability.slotDuration) || availability.slotDuration <= 0) return false

  const start = parseTimeToMinutes(availability.startTime)
  const end = parseTimeToMinutes(availability.endTime)

  return start >= 0 && end >= 0 && start < end
}

function toWhatsAppUrl(phone?: string) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  const normalized = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${normalized}`
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [needsAvailabilitySetup, setNeedsAvailabilitySetup] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user?.id) {
      setAppointments([])
      setServices([])
      setNeedsAvailabilitySetup(false)
      setLoading(false)
      return
    }
    const userId = user.id

    async function loadDashboard() {
      setLoading(true)
      try {
        const today = getTodayDate()
        const [appointmentsData, servicesData, availabilityData] = await Promise.all([
          getAppointments(userId, today),
          getServices(userId),
          getAvailability(userId),
        ])
        setAppointments(appointmentsData)
        setServices(servicesData)
        setNeedsAvailabilitySetup(!hasValidAvailability(availabilityData))
      } catch (error) {
        console.error("Error loading dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [authLoading, user?.id])

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => a.date.localeCompare(b.date))
  }, [appointments])

  const nextAppointment = useMemo(() => {
    const now = dayjs().tz("America/Sao_Paulo")
    return sortedAppointments.find((app) => dayjs(app.date).isAfter(now))
  }, [sortedAppointments])

  const totalAppointments = appointments.length

  const totalRevenue = useMemo(() => {
    return appointments.reduce((sum, app) => {
      const service = services.find((s) => s.id === app.serviceId)
      return sum + (service?.price || 0)
    }, 0)
  }, [appointments, services])

  const isPageLoading = loading || authLoading

  return (
    <div className="min-h-screen bg-background pb-24 font-sans md:pb-0">
      <Header />
      <main className="mx-auto w-full max-w-4xl p-4 md:p-8">
        <div className="mb-8">
          <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">
            Visão Geral
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
            Olá, {user?.name.split(' ')[0] || "Profissional"}
          </h1>
        </div>

        {!isPageLoading && needsAvailabilitySetup && (
          <section className="mb-8 overflow-hidden rounded-[2rem] border border-destructive/20 bg-destructive/5 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                <FaExclamationTriangle size={24} aria-hidden />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">
                  Sua agenda ainda não está configurada
                </h3>
                <p className="mt-1 text-[15px] font-medium text-muted-foreground leading-relaxed">
                  Defina seus dias e horários de atendimento para que seus clientes possam realizar agendamentos online.
                </p>
                <ButtonLink
                  href="/configuracoes"
                  variant="primary"
                  className="mt-6 w-full md:w-auto"
                >
                  Configurar agora
                </ButtonLink>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="group relative overflow-hidden p-6 hover:border-primary/50 transition-colors">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FaCalendarCheck size={100} />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FaCalendarCheck size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Agendamentos hoje</span>
                  </div>
                  <p className="text-3xl font-black text-foreground">
                    {isPageLoading ? "..." : totalAppointments}
                  </p>
                </div>
              </Card>

              <Card className="group relative overflow-hidden p-6 hover:border-primary/50 transition-colors">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FaClock size={100} />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FaClock size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Próximo</span>
                  </div>
                  <p className="text-3xl font-black text-foreground">
                    {isPageLoading
                      ? "..."
                      : nextAppointment
                        ? formatToLocalTime(nextAppointment.date)
                        : "--:--"}
                  </p>
                </div>
              </Card>

              <Card className="group relative overflow-hidden p-6 sm:col-span-2 bg-primary text-primary-foreground border-primary">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <FaMoneyBillWave size={120} />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 opacity-80 mb-1">
                    <FaMoneyBillWave size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Faturamento Estimado</span>
                  </div>
                  <p className="text-4xl font-black">
                    {isPageLoading ? "..." : `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`}
                  </p>
                </div>
              </Card>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Agenda de Hoje
                </h2>
                <Link href="/agenda" className="text-xs font-bold text-primary hover:underline">
                  Ver tudo
                </Link>
              </div>

              {isPageLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {sortedAppointments.map((app, index) => {
                    const service = services.find((s) => s.id === app.serviceId)
                    const whatsappUrl = toWhatsAppUrl(app.clientWhatsapp)
                    const appointmentKey =
                      app.id ||
                      (app as Appointment & { _id?: string })._id ||
                      `${app.userId}-${app.serviceId}-${app.date}-${app.clientName}-${index}`

                    return (
                      <li
                        key={appointmentKey}
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-accent/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground font-bold">
                            {app.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">
                              {app.clientName}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">
                              {service?.name || "Serviço"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-black text-foreground">
                              {formatToLocalTime(app.date)}
                            </div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">
                              Confirmado
                            </div>
                          </div>
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white"
                            >
                              <FaWhatsapp size={20} />
                            </a>
                          )}
                        </div>
                      </li>
                    )
                  })}

                  {appointments.length === 0 && (
                    <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
                      <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                        <FaCalendarAlt size={32} />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">
                        Nenhum agendamento para hoje.
                      </p>
                      <ButtonLink href="/agenda" variant="link" className="mt-2">
                        Criar agendamento manual
                      </ButtonLink>
                    </Card>
                  )}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 text-sm font-bold text-foreground uppercase tracking-wider">
                Ações Rápidas
              </h3>
              <div className="flex flex-col gap-3">
                <ButtonLink href="/agenda" variant="secondary" className="justify-start">
                  <FaCalendarAlt className="text-primary" />
                  Abrir Agenda
                </ButtonLink>
                <ButtonLink href="/servicos" variant="secondary" className="justify-start">
                  <FaWrench className="text-primary" />
                  Meus Serviços
                </ButtonLink>
                <ButtonLink href="/profissionais" variant="secondary" className="justify-start">
                  <FaUserTie className="text-primary" />
                  Equipe
                </ButtonLink>
              </div>
            </Card>

            <Card className="overflow-hidden bg-primary/5 border-primary/20">
              <div className="p-6">
                <h3 className="mb-2 text-sm font-bold text-foreground">Link Público</h3>
                <p className="text-xs font-medium text-muted-foreground mb-4">
                  Compartilhe seu link para que clientes possam agendar sozinhos.
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-input bg-background p-2 pr-1">
                  <span className="flex-1 truncate text-xs font-mono text-muted-foreground px-2">
                    agendo.me/{user?.slug || "seu-link"}
                  </span>
                  <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                    Copiar
                  </button>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
