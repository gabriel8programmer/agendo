"use client"

import { useState, useEffect, useMemo } from "react"
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
import { getAppointments, getServices } from "@/lib/api"
import { Appointment, Service } from "@/types"
import { formatToLocalTime, getTodayDate, dayjs } from "@/lib/utils/date"

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const userId = "user-1"

  useEffect(() => {
    async function loadDashboard() {
      try {
        const today = getTodayDate()
        const [appointmentsData, servicesData] = await Promise.all([
          getAppointments(userId, today),
          getServices(userId),
        ])
        setAppointments(appointmentsData)
        setServices(servicesData)
      } catch (error) {
        console.error("Error loading dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

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
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {loading ? "..." : totalAppointments}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <FaClock className="text-zinc-900" aria-hidden />
                  <h2 className="text-sm font-medium text-zinc-700">Próximo atendimento</h2>
                </div>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {loading
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
                  {loading ? "..." : `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`}
                </p>
              </Card>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-sm font-medium text-zinc-700 uppercase tracking-wider">
              Próximos atendimentos
            </h2>

            {loading ? (
              <p className="text-center text-sm text-zinc-500 py-4">Carregando...</p>
            ) : (
              <ul className="space-y-3">
                {sortedAppointments.map((app, index) => {
                  const service = services.find((s) => s.id === app.serviceId)
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
                          <div className="text-sm text-zinc-600 font-medium">
                            {service?.name || "Serviço não encontrado"}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {formatToLocalTime(app.date)}
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
