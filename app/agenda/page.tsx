"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import Input from "@/components/ui/Input"
import { useAuth } from "@/components/providers/AuthProvider"
import { useToast } from "@/components/ui/Toast"
import {
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaUser,
  FaPlus,
  FaExclamationTriangle,
  FaWhatsapp,
  FaCalendarAlt,
  FaTrash,
  FaTimes,
} from "react-icons/fa"
import {
  getAvailability,
  getAppointments,
  getServices,
  getProfessionals,
  deleteAppointment,
  createAppointment,
} from "@/lib/api"
import { formatToLocalTime, formatToUTC, dayjs } from "@/lib/utils/date"
import { Professional, Service, Appointment } from "@/types"

interface TimeSlot {
  id: string
  time: string
  status: "available" | "booked" | "reserved"
  clientName?: string
  serviceName?: string
  clientWhatsapp?: string
  professionalName?: string
}

function toWhatsAppUrl(
  phone?: string,
  clientName?: string,
  serviceName?: string,
  time?: string,
  dateFormatted?: string
) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  const normalized = digits.startsWith("55") ? digits : `55${digits}`
  const dateText = dateFormatted ? ` no dia *${dateFormatted}*` : ""
  const message = encodeURIComponent(
    `Olá, ${clientName || "cliente"}! Tudo bem?\n\n` +
      `Passando para lembrar do seu agendamento de *${serviceName || "atendimento"}*${dateText} às *${time || ""}*.\n\n` +
      `Qualquer dúvida ou imprevisto, estamos à disposição! 💈`
  )
  return `https://wa.me/${normalized}?text=${message}`
}

function SlotItem({
  slot,
  dateFormatted,
  onOpenManual,
  onRequestCancel,
}: {
  slot: TimeSlot
  dateFormatted: string
  onOpenManual: (time: string) => void
  onRequestCancel: (slot: TimeSlot) => void
}) {
  const isAvailable = slot.status === "available"
  const isReserved = slot.status === "reserved"
  const whatsappUrl = toWhatsAppUrl(
    slot.clientWhatsapp,
    slot.clientName,
    slot.serviceName,
    slot.time,
    dateFormatted
  )

  if (isReserved) return null

  return (
    <div
      className={`group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300 ${
        isAvailable
          ? "cursor-pointer border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]"
          : "border-transparent bg-muted/30"
      }`}
      onClick={() => {
        if (isAvailable) {
          onOpenManual(slot.time)
        }
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center border-r border-border pr-5">
          <span
            className={`text-[15px] font-black ${isAvailable ? "text-foreground" : "text-muted-foreground"}`}
          >
            {slot.time}
          </span>
          <FaClock size={10} className="mt-1 text-muted-foreground/50" aria-hidden />
        </div>

        {isAvailable ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <FaPlus size={12} />
            </div>
            <div>
              <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                Horário Disponível
              </span>
              <p className="text-[10px] text-muted-foreground/60 hidden sm:block">
                Clique para agendar encaixe
              </p>
            </div>
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
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-primary/70">
                  {slot.serviceName}
                </span>
                {slot.professionalName && (
                  <>
                    <span className="text-[10px] text-muted-foreground/40">•</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {slot.professionalName}
                    </span>
                  </>
                )}
              </div>
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
              title="Enviar lembrete pelo WhatsApp"
              aria-label="Enviar lembrete pelo WhatsApp"
              onClick={(e) => e.stopPropagation()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20"
            >
              <FaWhatsapp size={20} />
            </a>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRequestCancel(slot)
            }}
            title="Desmarcar agendamento"
            aria-label="Desmarcar agendamento"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-all hover:bg-destructive hover:text-white hover:shadow-lg hover:shadow-destructive/20"
          >
            <FaTrash size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

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

export default function AgendaPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast, ToastComponent } = useToast()

  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>("all")
  const [isWorkingDay, setIsWorkingDay] = useState(true)
  const [needsAvailabilitySetup, setNeedsAvailabilitySetup] = useState(false)
  const [date, setDate] = useState(dayjs().tz("America/Sao_Paulo"))

  // Modais de cancelamento e encaixe manual
  const [cancelTarget, setCancelTarget] = useState<TimeSlot | null>(null)
  const [manualBookingTime, setManualBookingTime] = useState<string | null>(null)
  const [manualClientName, setManualClientName] = useState("")
  const [manualClientWhatsapp, setManualClientWhatsapp] = useState("")
  const [manualServiceId, setManualServiceId] = useState("")
  const [manualProfId, setManualProfId] = useState("any")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadAgenda = useCallback(async () => {
    if (!user?.id) return
    const userId = user.id

    setLoading(true)
    try {
      const dateString = date.format("YYYY-MM-DD")
      const dayOfWeek = date.day()

      const [availability, appointmentsData, servicesData, professionalsData] = await Promise.all([
        getAvailability(userId),
        getAppointments(userId, dateString),
        getServices(userId),
        getProfessionals(userId),
      ])

      const activeProfessionals = professionalsData.filter((p) => p.isActive)
      setServices(servicesData)
      setProfessionals(activeProfessionals)
      setAppointments(appointmentsData)

      // Se houver filtro de profissional ativo, usar disponibilidade do profissional se existir
      const chosenProf =
        selectedProfFilter !== "all"
          ? activeProfessionals.find((p) => p.id === selectedProfFilter)
          : null

      const effectiveAvailability =
        chosenProf?.availability && chosenProf.availability.workDays?.length > 0
          ? {
              id: chosenProf.id,
              userId,
              slotDuration:
                chosenProf.availability.slotDuration || availability?.slotDuration || 30,
              startTime: chosenProf.availability.startTime || availability?.startTime || "09:00",
              endTime: chosenProf.availability.endTime || availability?.endTime || "18:00",
              workDays: chosenProf.availability.workDays,
              reservedIntervals: chosenProf.availability.reservedIntervals || [],
            }
          : availability

      const startMinutes = parseTimeToMinutes(effectiveAvailability?.startTime || "")
      const endMinutes = parseTimeToMinutes(effectiveAvailability?.endTime || "")
      const hasValidAvailability =
        !!effectiveAvailability &&
        Array.isArray(effectiveAvailability.workDays) &&
        effectiveAvailability.workDays.length > 0 &&
        Number.isFinite(effectiveAvailability.slotDuration) &&
        effectiveAvailability.slotDuration > 0 &&
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

      const isOpen = effectiveAvailability.workDays?.includes(dayOfWeek)
      setIsWorkingDay(!!isOpen)

      if (!isOpen) {
        setSlots([])
        setLoading(false)
        return
      }

      // Filtrar agendamentos pelo profissional se selecionado
      const relevantAppointments =
        selectedProfFilter === "all"
          ? appointmentsData
          : appointmentsData.filter((app) => app.professionalId === selectedProfFilter)

      const allGeneratedSlots: TimeSlot[] = []
      let current = parseTimeToMinutes(effectiveAvailability.startTime)
      const end = parseTimeToMinutes(effectiveAvailability.endTime)

      while (current + effectiveAvailability.slotDuration <= end) {
        const timeString = formatMinutesToTime(current)
        const slotEnd = current + effectiveAvailability.slotDuration

        const isReserved = effectiveAvailability.reservedIntervals?.some((interval) => {
          const resStart = parseTimeToMinutes(interval.startTime)
          const resEnd = parseTimeToMinutes(interval.endTime)
          return current < resEnd && slotEnd > resStart
        })

        if (isReserved) {
          allGeneratedSlots.push({ id: timeString, time: timeString, status: "reserved" })
        } else {
          const appointment = relevantAppointments.find((app) => {
            const appTime = app.time || formatToLocalTime(app.date)
            return appTime === timeString
          })

          if (appointment) {
            const service = servicesData.find((s) => s.id === appointment.serviceId)
            const prof = activeProfessionals.find((p) => p.id === appointment.professionalId)
            const appointmentId =
              appointment.id || (appointment as { _id?: string })._id || `${timeString}-booked`
            allGeneratedSlots.push({
              id: String(appointmentId),
              time: timeString,
              status: "booked",
              clientName: appointment.clientName,
              clientWhatsapp: appointment.clientWhatsapp,
              serviceName: service?.name || "Serviço",
              professionalName: prof?.name,
            })
          } else {
            allGeneratedSlots.push({ id: timeString, time: timeString, status: "available" })
          }
        }
        current += effectiveAvailability.slotDuration
      }
      setSlots(allGeneratedSlots)
    } catch (error) {
      console.error("Error loading agenda:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, date, selectedProfFilter])

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setSlots([])
      setIsWorkingDay(false)
      setNeedsAvailabilitySetup(false)
      setLoading(false)
      return
    }
    loadAgenda()
  }, [authLoading, user?.id, loadAgenda])

  const changeDate = (days: number) => {
    setDate(date.add(days, "day"))
  }

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !user?.id || isSubmitting) return
    setIsSubmitting(true)
    try {
      await deleteAppointment(cancelTarget.id, user.id)
      showToast("Agendamento desmarcado com sucesso!", "success")
      setCancelTarget(null)
      await loadAgenda()
    } catch (err) {
      console.error("Erro ao desmarcar agendamento:", err)
      showToast("Não foi possível desmarcar o agendamento.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenManualBooking = (time: string) => {
    setManualBookingTime(time)
    setManualClientName("")
    setManualClientWhatsapp("")
    if (services.length > 0 && !manualServiceId) {
      setManualServiceId(services[0].id)
    }
    setManualProfId(selectedProfFilter !== "all" ? selectedProfFilter : "any")
  }

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !manualBookingTime ||
      !user?.id ||
      !manualServiceId ||
      !manualClientName.trim() ||
      isSubmitting
    ) {
      return
    }

    setIsSubmitting(true)
    try {
      const digits = manualClientWhatsapp.replace(/\D/g, "")
      const formattedWhatsapp = digits
        ? digits.startsWith("55")
          ? `+${digits}`
          : `+55${digits}`
        : undefined

      await createAppointment({
        userId: user.id,
        serviceId: manualServiceId,
        professionalId: manualProfId && manualProfId !== "any" ? manualProfId : undefined,
        clientName: manualClientName.trim(),
        clientWhatsapp: formattedWhatsapp,
        date: formatToUTC(date.format("YYYY-MM-DD"), manualBookingTime),
        time: manualBookingTime,
      })

      showToast("Encaixe agendado com sucesso!", "success")
      setManualBookingTime(null)
      setManualClientName("")
      setManualClientWhatsapp("")
      await loadAgenda()
    } catch (err) {
      console.error("Erro ao criar agendamento manual:", err)
      showToast("Não foi possível realizar o agendamento.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const bookedTotal = useMemo(() => {
    return appointments.length
  }, [appointments])

  return (
    <div className="min-h-screen bg-background pb-24 font-sans md:pb-0">
      <Header />
      <main className="mx-auto max-w-2xl p-4 md:p-8">
        <header className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                Minha Agenda
              </p>
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

          {/* Filtro por Profissional / Barbeiro */}
          {professionals.length > 0 && (
            <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 mr-1">
                Barbeiro:
              </span>
              <button
                type="button"
                onClick={() => setSelectedProfFilter("all")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedProfFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Todos</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    selectedProfFilter === "all" ? "bg-white/20 text-white" : "bg-background/80"
                  }`}
                >
                  {bookedTotal}
                </span>
              </button>
              {professionals.map((prof) => {
                const count = appointments.filter((a) => a.professionalId === prof.id).length
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => setSelectedProfFilter(prof.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedProfFilter === prof.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{prof.name}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                        selectedProfFilter === prof.id
                          ? "bg-white/20 text-white"
                          : "bg-background/80"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
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
              <ButtonLink href="/configuracoes" variant="primary" className="mt-6 mx-auto">
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
                className="mt-6 text-xs font-black uppercase tracking-widest text-primary hover:underline cursor-pointer"
              >
                Voltar para hoje
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {slots
                .filter((s) => s.status !== "reserved")
                .map((slot) => (
                  <SlotItem
                    key={`${slot.time}-${slot.status}-${slot.id}`}
                    slot={slot}
                    dateFormatted={date.format("DD/MM/YYYY")}
                    onOpenManual={handleOpenManualBooking}
                    onRequestCancel={setCancelTarget}
                  />
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

      {/* Modal de Cancelamento */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-sm w-full p-6 space-y-4 rounded-3xl shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
              <FaTrash size={20} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">Desmarcar Horário</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Deseja desmarcar o agendamento de{" "}
                <span className="font-bold text-foreground">{cancelTarget.clientName}</span> às{" "}
                <span className="font-bold text-primary">{cancelTarget.time}</span>?
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                O horário será liberado imediatamente para novos clientes.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setCancelTarget(null)}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Desmarcando..." : "Sim, desmarcar"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Agendamento Manual / Encaixe */}
      {manualBookingTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-md w-full p-6 md:p-8 space-y-5 rounded-3xl shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">Novo Encaixe</h3>
                <p className="text-xs font-semibold text-muted-foreground">
                  {date.format("D [de] MMMM")} às{" "}
                  <span className="text-primary font-bold">{manualBookingTime}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualBookingTime(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 cursor-pointer rounded-lg hover:bg-muted"
                aria-label="Fechar modal"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Serviço
                </label>
                <div className="relative">
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    required
                    className="w-full h-12 rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.duration} min) - R${" "}
                        {Number(s.price || 0)
                          .toFixed(2)
                          .replace(".", ",")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {professionals.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Barbeiro / Profissional
                  </label>
                  <select
                    value={manualProfId}
                    onChange={(e) => setManualProfId(e.target.value)}
                    className="w-full h-12 rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="any">Sem preferência (Geral)</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                label="Nome do Cliente"
                id="clientName"
                value={manualClientName}
                onChange={(e) => setManualClientName(e.target.value)}
                placeholder="Ex: João da Silva"
                required
                icon={<FaUser size={14} />}
              />

              <Input
                label="WhatsApp do Cliente (Opcional)"
                id="clientWhatsapp"
                type="tel"
                value={manualClientWhatsapp}
                onChange={(e) => setManualClientWhatsapp(e.target.value)}
                placeholder="(00) 00000-0000"
                icon={<FaWhatsapp size={14} />}
              />

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setManualBookingTime(null)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isSubmitting || !manualClientName.trim()}
                >
                  {isSubmitting ? "Agendando..." : "Confirmar Encaixe"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {ToastComponent}
    </div>
  )
}
