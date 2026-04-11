"use client"

import { useState, useEffect, useMemo } from "react"
import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaClock,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaUser,
  FaWhatsapp,
  FaWrench,
} from "react-icons/fa"

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

  // Use useMemo to avoid recalculating on every render and avoid state mutation
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
    <div className="min-h-screen bg-[#f9fafb] pb-24 font-sans md:pb-0">
      <Header />
      <main className="mx-auto w-full max-w-2xl p-4">
        <Card className="p-6">
          <header className="mb-6">
            <p className="text-sm font-medium text-zinc-600 uppercase tracking-widest">
              Resumo do dia
            </p>
            <h1 className="text-xl font-bold text-zinc-900">Bom dia, {user?.name.split(' ')[0] || "Profissional"}</h1>
          </header>

          {!isPageLoading && needsAvailabilitySetup && (
            <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="mt-0.5 text-amber-600" aria-hidden />
                <div className="w-full">
                  <p className="text-sm font-semibold text-amber-900">
                    Configure seus dias e horários para receber agendamentos
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Sua agenda ainda não está pronta. Defina os dias de atendimento e o horário
                    padrão para habilitar novos agendamentos.
                  </p>
                  <ButtonLink
                    href="/configuracoes"
                    variant="secondary"
                    className="mt-3 w-full sm:w-auto"
                  >
                    Configurar horários
                  </ButtonLink>
                </div>
              </div>
            </section>
          )}

          <section className="mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <FaCalendarCheck className="text-zinc-900" aria-hidden />
                  <h2 className="text-sm font-medium text-zinc-700">Agendamentos hoje</h2>
                </div>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {isPageLoading ? "..." : totalAppointments}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <FaClock className="text-zinc-900" aria-hidden />
                  <h2 className="text-sm font-medium text-zinc-700">Próximo atendimento</h2>
                </div>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {isPageLoading
                    ? "..."
                    : nextAppointment
                      ? formatToLocalTime(nextAppointment.date)
                      : "--:--"}
                </p>
              </Card>

              <Card className="p-4 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-zinc-900" aria-hidden />
                  <h2 className="text-sm font-medium text-zinc-700">Faturamento hoje</h2>
                </div>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {isPageLoading ? "..." : `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`}
                </p>
              </Card>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-sm font-medium text-zinc-700 uppercase tracking-wider">
              Próximos atendimentos
            </h2>

            {isPageLoading ? (
              <p className="text-center text-sm text-zinc-500 py-4">Carregando...</p>
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
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-zinc-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-200">
                          <FaUser className="text-zinc-400" aria-hidden />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">
                            {app.clientName}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-zinc-600 font-medium">
                              {service?.name || "Serviço não encontrado"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Conversar com ${app.clientName} no WhatsApp`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100"
                          >
                            <FaWhatsapp size={18} />
                          </a>
                        )}
                        <div className="text-sm font-semibold text-zinc-900">
                        {formatToLocalTime(app.date)}
                        </div>
                      </div>
                    </li>
                  )
                })}

                {appointments.length === 0 && (
                  <li className="text-center text-sm text-zinc-500 py-4">
                    Nenhum agendamento para hoje.
                  </li>
                )}
              </ul>
            )}
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
