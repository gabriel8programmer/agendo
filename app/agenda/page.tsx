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
  FaCalendarAlt,
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

  if (isReserved) return null

  return (
    <div
      className={`group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300 ${
        isAvailable
          ? "cursor-pointer border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
          : "border-transparent bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center border-r border-border pr-5">
          <span className={`text-[15px] font-black ${isAvailable ? "text-foreground" : "text-muted-foreground"}`}>
            {slot.time}
          </span>
          <FaClock size={10} className="mt-1 text-muted-foreground/50" aria-hidden />
        </div>

        {isAvailable ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <FaPlus size={12} />
            </div>
            <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
              Horário Disponível
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background border border-border text-muted-foreground shadow-sm">
              <FaUser size={14} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground leading-tight">
                {slot.clientName}
              </p>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-primary/70">
                {slot.serviceName}
              </p>
            </div>
          </div>
        )}
      </div>

      {!isAvailable && (
        <div className="flex items-center gap-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20"
            >
              <FaWhatsapp size={20} />
            </a>
          )}
          <div className="hidden sm:block rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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

          const allGeneratedSlots: TimeSlot[] = []
          let current = parseTimeToMinutes(availability.startTime)
          const end = parseTimeToMinutes(availability.endTime)

          while (current + availability.slotDuration <= end) {
            const timeString = formatMinutesToTime(current)
            const slotEnd = current + availability.slotDuration

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
    <div className="min-h-screen bg-background pb-24 font-sans md:pb-0">
      <Header />
      <main className="mx-auto max-w-2xl p-4 md:p-8">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Minha Agenda</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                Gestão de Horários
              </h1>
            </div>
            
            <div className="flex items-center gap-1 rounded-[1.5rem] border border-border bg-card p-1 shadow-xl shadow-black/5 ring-1 ring-black/5">
              <button
                onClick={() => changeDate(-1)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[1.25rem] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all active:scale-90"
                aria-label="Dia anterior"
              >
                <FaChevronLeft size={16} />
              </button>
              
              <div className="px-4 text-center w-full">
                <p className="text-[15px] font-black text-foreground capitalize">
                  {date.isSame(dayjs(), "day") ? "Hoje" : date.format("dddd")}
                </p>
                <p className="text-[11px] font-bold text-muted-foreground tracking-tight">
                  {date.format("D [de] MMMM")}
                </p>
              </div>

              <button
                onClick={() => changeDate(1)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[1.25rem] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all active:scale-90"
                aria-label="Próximo dia"
              >
                <FaChevronRight size={16} />
              </button>
            </div>
          </div>
        </header>

        <section>
          {loading || authLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : needsAvailabilitySetup ? (
            <Card className="overflow-hidden border-destructive/20 bg-destructive/5 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <FaExclamationTriangle size={32} aria-hidden />
              </div>
              <h2 className="text-xl font-bold text-foreground">Configuração Pendente</h2>
              <p className="mt-2 text-[15px] font-medium text-muted-foreground">
                Defina seus horários de atendimento para habilitar sua agenda.
              </p>
              <ButtonLink
                href="/configuracoes"
                variant="primary"
                className="mt-6 mx-auto"
              >
                Ir para Configurações
              </ButtonLink>
            </Card>
          ) : !isWorkingDay ? (
            <Card className="flex flex-col items-center justify-center border-dashed py-16 text-center">
              <div className="mb-6 rounded-[2rem] bg-muted p-6 text-muted-foreground/30">
                <FaCalendarAlt size={48} />
              </div>
              <h2 className="text-xl font-black text-foreground">Dia de Folga</h2>
              <p className="mt-2 max-w-[240px] text-sm font-bold text-muted-foreground/60">
                Este dia não possui horários de atendimento configurados.
              </p>
              <button 
                onClick={() => setDate(dayjs().tz("America/Sao_Paulo"))}
                className="mt-6 text-xs font-black uppercase tracking-widest text-primary hover:underline"
              >
                Voltar para hoje
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {slots
                .filter((s) => s.status !== "reserved")
                .map((slot) => (
                  <SlotItem key={`${slot.time}-${slot.status}-${slot.id}`} slot={slot} />
                ))}
              {slots.filter((s) => s.status !== "reserved").length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-sm font-bold text-muted-foreground italic">
                    Nenhum horário disponível no expediente.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
