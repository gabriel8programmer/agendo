"use client"

import { useState, useEffect } from "react"
import ButtonLink from "@/components/ui/ButtonLink"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import { useAuth } from "@/components/providers/AuthProvider"
import {
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaUser,
  FaPlus,
  FaExclamationTriangle,
  FaWhatsapp,
} from "react-icons/fa"
import { getAvailability, getAppointments, getServices } from "@/lib/api"
import { formatToLocalTime, dayjs } from "@/lib/utils/date"

interface TimeSlot {
  id: string
  time: string
  status: "available" | "booked" | "reserved"
  clientName?: string
  serviceName?: string
  clientWhatsapp?: string
}

function toWhatsAppUrl(phone?: string) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  const normalized = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${normalized}`
}

function SlotItem({ slot }: { slot: TimeSlot }) {
  const isAvailable = slot.status === "available"
  const isReserved = slot.status === "reserved"
  const whatsappUrl = toWhatsAppUrl(slot.clientWhatsapp)

  if (isReserved) return null // Esconder horários reservados conforme solicitado

  return (
    <div
      className={`group flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 transition-all ${
        isAvailable
          ? "cursor-pointer border-zinc-100 bg-white hover:border-zinc-300 hover:shadow-sm"
          : "border-transparent bg-zinc-50"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center border-r border-zinc-200 pr-4">
          <span className="text-sm font-bold text-zinc-900">{slot.time}</span>
          <FaClock size={12} className="text-zinc-400" aria-hidden />
        </div>

        {isAvailable ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
              <FaPlus size={12} />
            </div>
            <span className="text-sm font-medium text-zinc-500">Disponível</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-400 shadow-sm">
              <FaUser size={12} />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">{slot.clientName}</p>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {slot.serviceName}
              </p>
            </div>
          </div>
        )}
      </div>

      {!isAvailable && (
        <div className="flex items-center gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Conversar com ${slot.clientName} no WhatsApp`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100"
            >
              <FaWhatsapp size={18} />
            </a>
          )}
          <div className="rounded-lg bg-zinc-200 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-zinc-600">
            Ocupado
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgendaPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isWorkingDay, setIsWorkingDay] = useState(true)
  const [needsAvailabilitySetup, setNeedsAvailabilitySetup] = useState(false)
  const [date, setDate] = useState(dayjs().tz("America/Sao_Paulo"))

  useEffect(() => {
    if (authLoading) return

    if (!user?.id) {
      setSlots([])
      setIsWorkingDay(false)
      setNeedsAvailabilitySetup(false)
      setLoading(false)
      return
    }
    const userId = user.id

    async function loadAgenda() {
      setLoading(true)
      try {
        const dateString = date.format("YYYY-MM-DD")
        const dayOfWeek = date.day()

        const [availability, appointments, services] = await Promise.all([
          getAvailability(userId),
          getAppointments(userId, dateString),
          getServices(userId),
        ])

        const startMinutes = parseTimeToMinutes(availability?.startTime || "")
        const endMinutes = parseTimeToMinutes(availability?.endTime || "")
        const hasValidAvailability =
          !!availability &&
          Array.isArray(availability.workDays) &&
          availability.workDays.length > 0 &&
          Number.isFinite(availability.slotDuration) &&
          availability.slotDuration > 0 &&
          startMinutes >= 0 &&
          endMinutes >= 0 &&
          startMinutes < endMinutes

        if (!hasValidAvailability) {
          setNeedsAvailabilitySetup(true)
          setIsWorkingDay(false)
          setSlots([])
          setLoading(false)
          return
        }
        setNeedsAvailabilitySetup(false)

        if (availability) {
          const isOpen = availability.workDays?.includes(dayOfWeek)
          setIsWorkingDay(!!isOpen)

          if (!isOpen) {
            setSlots([])
            setLoading(false)
            return
          }

          // Mapear todos os slots (disponíveis + ocupados)
          const allGeneratedSlots: TimeSlot[] = []

          // Precisamos gerar TODOS os slots do expediente para mostrar na agenda do barbeiro
          let current = parseTimeToMinutes(availability.startTime)
          const end = parseTimeToMinutes(availability.endTime)

          while (current + availability.slotDuration <= end) {
            const timeString = formatMinutesToTime(current)
            const slotEnd = current + availability.slotDuration

            // Verificar se é horário reservado
            const isReserved = availability.reservedIntervals?.some((interval) => {
              const resStart = parseTimeToMinutes(interval.startTime)
              const resEnd = parseTimeToMinutes(interval.endTime)
              return current < resEnd && slotEnd > resStart
            })

            if (isReserved) {
              allGeneratedSlots.push({ id: timeString, time: timeString, status: "reserved" })
            } else {
              const appointment = appointments.find((app) => {
                const appTime = app.time || formatToLocalTime(app.date)
                return appTime === timeString
              })

              if (appointment) {
                const service = services.find((s) => s.id === appointment.serviceId)
                const appointmentId =
                  appointment.id || (appointment as { _id?: string })._id || `${timeString}-booked`
                allGeneratedSlots.push({
                  id: String(appointmentId),
                  time: timeString,
                  status: "booked",
                  clientName: appointment.clientName,
                  clientWhatsapp: appointment.clientWhatsapp,
                  serviceName: service?.name || "Serviço não encontrado",
                })
              } else {
                allGeneratedSlots.push({ id: timeString, time: timeString, status: "available" })
              }
            }
            current += availability.slotDuration
          }
          setSlots(allGeneratedSlots)
        }
      } catch (error) {
        console.error("Error loading agenda:", error)
      } finally {
        setLoading(false)
      }
    }
    loadAgenda()
  }, [authLoading, date, user?.id])

  const todayLabel = date.format("dddd, D [de] MMMM")

  function parseTimeToMinutes(time: string): number {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
    if (!match) return -1
    const hours = Number(match[1])
    const minutes = Number(match[2])
    return hours * 60 + minutes
  }

  function formatMinutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const changeDate = (days: number) => {
    setDate(date.add(days, "day"))
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      <Header />
      <main className="mx-auto max-w-2xl p-4">
        <header className="mb-6 flex flex-col items-center gap-4">
          <div className="flex w-full items-center justify-between rounded-2xl bg-white p-2 shadow-sm border border-zinc-100">
            <button
              onClick={() => changeDate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <FaChevronLeft size={14} />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-zinc-900 capitalize">{todayLabel}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Agenda do Dia
              </p>
            </div>
            <button
              onClick={() => changeDate(1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <FaChevronRight size={14} />
            </button>
          </div>
        </header>

        <Card className="p-4 sm:p-6">
          {loading || authLoading ? (
            <p className="text-center text-sm text-zinc-500">Carregando...</p>
          ) : needsAvailabilitySetup ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="mt-0.5 text-amber-600" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Configure sua agenda para começar a receber agendamentos
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Defina os dias de atendimento e horário padrão em Configurações.
                  </p>
                  <ButtonLink
                    href="/configuracoes"
                    variant="secondary"
                    className="mt-3 w-full sm:w-auto"
                  >
                    Configurar agenda
                  </ButtonLink>
                </div>
              </div>
            </div>
          ) : !isWorkingDay ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-400">
                <FaClock size={20} />
              </div>
              <p className="text-sm font-bold text-zinc-900">Não há atendimento hoje</p>
              <p className="text-xs text-zinc-500 mt-1">Este dia está configurado como folga.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots
                .filter((s) => s.status !== "reserved")
                .map((slot) => (
                  <SlotItem key={`${slot.time}-${slot.status}-${slot.id}`} slot={slot} />
                ))}
              {slots.filter((s) => s.status !== "reserved").length === 0 && (
                <p className="text-center text-sm text-zinc-500 italic">
                  Nenhum horário disponível no expediente.
                </p>
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
