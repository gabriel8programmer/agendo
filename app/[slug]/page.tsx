"use client"

import { useState, useEffect, use } from "react"
import {
  FaClock,
  FaTag,
  FaCheck,
  FaPhoneAlt,
  FaUser,
  FaMoon,
  FaSun,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaBolt,
  FaExternalLinkAlt,
  FaMoneyBillWave,
} from "react-icons/fa"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Input from "@/components/ui/Input"
import BrandLogo from "@/components/ui/BrandLogo"
import {
  getUserBySlug,
  getServices,
  getAvailability,
  getAppointments,
  getProfessionals,
  createAppointment,
} from "@/lib/api"
import { generateSlots } from "@/lib/utils/availability"
import { User, Service, Availability, Appointment, Professional } from "@/types"
import { formatToUTC, getTodayDate, dayjs } from "@/lib/utils/date"
import { useToast } from "@/components/ui/Toast"
import { useTheme } from "@/components/providers/ThemeProvider"

const BRAZIL_COUNTRY_CODE = "55"
const BRAZIL_PHONE_PLACEHOLDER = "(00) 00000-0000"

function normalizeBrazilPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    digits = digits.slice(BRAZIL_COUNTRY_CODE.length)
  }
  return digits.slice(0, 11)
}

function formatBrazilPhoneForInput(digits: string) {
  const area = digits.slice(0, 2)
  const local = digits.slice(2)
  if (!area) return ""
  if (!local) return `(${area}) `
  if (local.length <= 4) {
    return `(${area}) ${local}`
  }
  if (local.length <= 8) {
    return `(${area}) ${local.slice(0, 4)}-${local.slice(4)}`
  }
  return `(${area}) ${local.slice(0, 5)}-${local.slice(5, 9)}`
}

function toE164BrazilPhone(digits: string) {
  return `+${BRAZIL_COUNTRY_CODE}${digits}`
}

export default function PublicBookingPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>
}) {
  const params = use(paramsPromise)
  const slug = params.slug

  const [user, setUser] = useState<User | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [occupiedAppointments, setOccupiedAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast, ToastComponent } = useToast()
  const { theme, toggleTheme } = useTheme()

  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>("any")
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState("")
  const [whatsappDigits, setWhatsappDigits] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const userData = await getUserBySlug(slug)
        if (userData) {
          const userId = userData.id || (userData as User & { _id?: string })._id || ""
          if (!userId) {
            setLoading(false)
            return
          }
          const normalizedUser: User = { ...userData, id: String(userId) }
          setUser(normalizedUser)
          const [servicesData, availabilityData, professionalsData] = await Promise.all([
            getServices(normalizedUser.id),
            getAvailability(normalizedUser.id),
            getProfessionals(normalizedUser.id),
          ])
          setServices(servicesData)
          setAvailability(availabilityData)
          setProfessionals(professionalsData.filter((p) => p.isActive))
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [slug])

  useEffect(() => {
    async function loadAppointments() {
      if (user) {
        try {
          const appointmentsData = await getAppointments(user.id, selectedDate)
          setOccupiedAppointments(appointmentsData)
          setSelectedTime(null)
        } catch (error) {
          console.error("Error loading appointments:", error)
        }
      }
    }
    loadAppointments()
  }, [user, selectedDate])

  const chosenService = services.find((s) => s.id === selectedService)

  // Profissionais que realizam o serviço selecionado
  const eligibleProfessionals = professionals.filter(
    (p) =>
      !p.serviceIds ||
      p.serviceIds.length === 0 ||
      (selectedService && p.serviceIds.includes(selectedService))
  )

  const chosenProfessional =
    selectedProfessional && selectedProfessional !== "any"
      ? professionals.find((p) => p.id === selectedProfessional)
      : null

  // Usar a disponibilidade do profissional específico se existir, senão a da barbearia
  const activeAvailability: Availability | null = chosenProfessional
    ? {
        id: chosenProfessional.id,
        userId: user?.id || "",
        slotDuration:
          chosenProfessional.availability.slotDuration || availability?.slotDuration || 30,
        startTime: chosenProfessional.availability.startTime || availability?.startTime || "09:00",
        endTime: chosenProfessional.availability.endTime || availability?.endTime || "18:00",
        workDays: chosenProfessional.availability.workDays || availability?.workDays || [],
        reservedIntervals:
          chosenProfessional.availability.reservedIntervals ||
          availability?.reservedIntervals ||
          [],
      }
    : availability

  // Filtrar os agendamentos ocupados por profissional se um foi escolhido
  const relevantOccupiedAppointments = chosenProfessional
    ? occupiedAppointments.filter(
        (app) => !app.professionalId || app.professionalId === chosenProfessional.id
      )
    : occupiedAppointments

  const availableTimes = activeAvailability
    ? generateSlots(activeAvailability, relevantOccupiedAppointments, selectedDate)
    : []

  const isWhatsappValid = whatsappDigits.length === 10 || whatsappDigits.length === 11
  const isFormValid =
    selectedService && selectedTime && clientName.trim().length > 0 && isWhatsappValid

  const handleConfirm = async () => {
    if (!isFormValid || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      await createAppointment({
        userId: user.id,
        serviceId: selectedService!,
        professionalId: chosenProfessional?.id,
        clientName,
        clientWhatsapp: toE164BrazilPhone(whatsappDigits),
        date: formatToUTC(selectedDate, selectedTime!),
      })
      setIsConfirmed(true)
      showToast("Agendamento realizado com sucesso!", "success")
    } catch (error) {
      console.error("Error creating appointment:", error)
      showToast("Erro ao confirmar agendamento.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateAvailableDates = () => {
    const dates = []
    const today = dayjs().tz("America/Sao_Paulo").startOf("day")
    const workDays = activeAvailability?.workDays || availability?.workDays || []
    for (let i = 0; i < 14; i++) {
      const date = today.add(i, "day")
      const dayOfWeek = date.day()
      if (workDays.includes(dayOfWeek)) {
        dates.push({
          value: date.format("YYYY-MM-DD"),
          label: date.format("ddd D MMM"),
          isToday: i === 0,
        })
      }
    }
    return dates
  }

  const availableDates = generateAvailableDates()

  const hasProfStep = eligibleProfessionals.length > 0
  const dateStepNumber = hasProfStep ? 3 : 2
  const timeStepNumber = hasProfStep ? 4 : 3
  const infoStepNumber = hasProfStep ? 5 : 4

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-bold text-sm">Preparando sua agenda...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans text-center">
        <Card className="p-12 max-w-sm rounded-[2.5rem]">
          <h1 className="text-2xl font-black text-foreground">Oops!</h1>
          <p className="mt-2 text-muted-foreground font-medium">
            O negócio que você procura não foi encontrado.
          </p>
          <ButtonLink href="/" className="mt-8 w-full">
            Voltar ao Início
          </ButtonLink>
        </Card>
      </div>
    )
  }

  if (isConfirmed) {
    const phoneForWhatsapp = user.phone ? user.phone.replace(/\D/g, "") : ""
    const destinationPhone = phoneForWhatsapp.startsWith("55")
      ? phoneForWhatsapp
      : `55${phoneForWhatsapp}`

    const whatsappMessage = encodeURIComponent(
      `💈 *Novo Agendamento*\n\n` +
        `Olá, *${user.companyName || user.name}*!\n` +
        `Acabei de agendar um horário pelo link:\n\n` +
        `👤 *Cliente:* ${clientName}\n` +
        `✂️ *Serviço:* ${chosenService?.name || "Serviço"}\n` +
        (chosenProfessional ? `💈 *Profissional:* ${chosenProfessional.name}\n` : "") +
        `📅 *Data:* ${dayjs(selectedDate).format("DD/MM/YYYY")} às ${selectedTime}\n` +
        (chosenService?.price
          ? `💵 *Valor:* R$ ${Number(chosenService.price).toFixed(2).replace(".", ",")}\n`
          : "") +
        (user.address ? `📍 *Local:* ${user.address}\n` : "") +
        `\nAgendado pelo *Agendo*!`
    )

    const whatsappUrl = phoneForWhatsapp
      ? `https://wa.me/${destinationPhone}?text=${whatsappMessage}`
      : `https://wa.me/?text=${whatsappMessage}`

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans text-center">
        <Card className="p-8 md:p-10 max-w-md w-full rounded-[2.5rem] shadow-2xl shadow-primary/10 border-primary/20 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
            <FaCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-foreground">Agendamento Confirmado!</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Olá <span className="text-foreground font-bold">{clientName}</span>, seu horário foi
            reservado com sucesso.
          </p>

          <div className="mt-6 rounded-2xl bg-muted/40 p-5 border border-border text-left space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Serviço
              </span>
              <span className="text-sm font-black text-foreground">{chosenService?.name}</span>
            </div>

            {chosenProfessional && (
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Profissional
                </span>
                <span className="text-sm font-black text-foreground">
                  {chosenProfessional.name}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Data & Horário
              </span>
              <span className="text-sm font-black text-primary">
                {dayjs(selectedDate).format("DD/MM/YYYY")} às {selectedTime}
              </span>
            </div>

            {chosenService?.price && (
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Valor
                </span>
                <span className="text-sm font-black text-foreground">
                  R$ {Number(chosenService.price).toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}

            {user.address && (
              <div className="flex items-start justify-between gap-3 pt-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                  Endereço
                </span>
                <span className="text-xs font-semibold text-right text-foreground">
                  {user.address}
                </span>
              </div>
            )}
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.98] transition-all"
          >
            <FaWhatsapp size={22} />
            Enviar Confirmação no WhatsApp
          </a>

          <Button
            variant="ghost"
            className="mt-3 w-full h-12 text-sm"
            onClick={() => {
              setIsConfirmed(false)
              setSelectedService(null)
              setSelectedProfessional("any")
              setSelectedTime(null)
              setSelectedDate(getTodayDate())
              setClientName("")
              setWhatsappDigits("")
            }}
          >
            Fazer outro agendamento
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12 font-sans selection:bg-primary/20">
      {/* Header com Toggle de Tema */}
      <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-4">
          <BrandLogo width={80} height={24} className="h-5 w-auto opacity-40 grayscale" />
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-90"
            aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          >
            {theme === "dark" ? <FaSun size={18} /> : <FaMoon size={18} />}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-12 md:pt-16">
        <header className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-primary/5 ring-1 ring-primary/10 shadow-inner">
            <span className="text-4xl font-black text-primary">
              {(user.companyName || user.name).charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {user.companyName || user.name}
          </h1>
          <p className="mt-2 text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Agendamento Online
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {user.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.address)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-accent/80 px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-primary transition-all shadow-sm"
              >
                <FaMapMarkerAlt className="text-primary text-[11px]" />
                <span className="max-w-[240px] truncate sm:max-w-sm">{user.address}</span>
                <FaExternalLinkAlt className="text-[9px] opacity-50" />
              </a>
            )}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <FaMoneyBillWave className="text-[11px]" />
              <span>Pagamento no local</span>
            </div>
          </div>
        </header>

        <div className="space-y-12">
          {/* STEP 1: SERVIÇOS */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-black text-primary-foreground shadow-lg shadow-primary/20">
                1
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                Escolha o Serviço
              </h2>
            </div>
            <div className="grid gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`group flex items-center justify-between rounded-[1.75rem] border p-5 text-left transition-all active:scale-[0.98] ${
                    selectedService === service.id
                      ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                        selectedService === service.id ? "bg-white/10" : "bg-muted"
                      }`}
                    >
                      <FaTag
                        size={16}
                        className={
                          selectedService === service.id ? "text-white" : "text-muted-foreground"
                        }
                      />
                    </div>
                    <div>
                      <p className="text-base font-bold">{service.name}</p>
                      <div
                        className={`mt-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                          selectedService === service.id ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        <FaClock size={12} />
                        <span>{service.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {service.price && (
                      <p className="text-sm font-black">
                        R$ {Number(service.price).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                    {selectedService === service.id && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary">
                        <FaCheck size={10} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* STEP 2: PROFISSIONAL (se houver profissionais cadastrados) */}
          {selectedService && hasProfStep && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-black text-primary-foreground shadow-lg shadow-primary/20">
                  2
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                  Escolha o Profissional
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSelectedProfessional("any")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all active:scale-95 ${
                    selectedProfessional === "any"
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "border-border bg-card hover:border-primary/50 text-foreground"
                  }`}
                >
                  <div
                    className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl ${
                      selectedProfessional === "any"
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <FaBolt size={18} />
                  </div>
                  <span className="text-xs font-bold leading-tight">Qualquer um</span>
                  <span
                    className={`text-[10px] mt-0.5 ${
                      selectedProfessional === "any" ? "text-white/80" : "text-muted-foreground"
                    }`}
                  >
                    Mais rápido
                  </span>
                </button>

                {eligibleProfessionals.map((prof) => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => setSelectedProfessional(prof.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all active:scale-95 ${
                      selectedProfessional === prof.id
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border-border bg-card hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <div
                      className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl font-black text-sm ${
                        selectedProfessional === prof.id
                          ? "bg-white/20 text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {prof.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold truncate max-w-full leading-tight">
                      {prof.name}
                    </span>
                    <span
                      className={`text-[10px] mt-0.5 truncate max-w-full ${
                        selectedProfessional === prof.id ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      Barbeiro
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* STEP DATA */}
          {selectedService && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-black text-primary-foreground shadow-lg shadow-primary/20">
                  {dateStepNumber}
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                  Selecione o Dia
                </h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {availableDates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => setSelectedDate(date.value)}
                    className={`flex min-w-[90px] flex-col items-center rounded-2xl border p-4 transition-all active:scale-90 ${
                      selectedDate === date.value
                        ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/10"
                        : "border-border bg-card hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                        selectedDate === date.value ? "text-white/60" : "text-muted-foreground/60"
                      }`}
                    >
                      {date.isToday ? "Hoje" : date.label.split(" ")[0]}
                    </span>
                    <span className="text-sm font-black capitalize">
                      {date.label.split(" ").slice(1).join(" ")}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* STEP HORÁRIOS */}
          {selectedService && selectedDate && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-black text-primary-foreground shadow-lg shadow-primary/20">
                  {timeStepNumber}
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                  Horário Disponível
                </h2>
              </div>
              <Card className="p-5 md:p-6">
                {availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {availableTimes.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.isAvailable && setSelectedTime(slot.time)}
                        disabled={!slot.isAvailable}
                        className={`rounded-xl border py-3 text-sm font-black transition-all active:scale-95 ${
                          !slot.isAvailable
                            ? "border-transparent bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
                            : selectedTime === slot.time
                              ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "border-border bg-background text-foreground hover:border-primary/50"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm font-bold text-muted-foreground italic">
                      Nenhum horário disponível para esta data.
                    </p>
                  </div>
                )}
              </Card>
            </section>
          )}

          {/* STEP DADOS */}
          {selectedTime && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-black text-primary-foreground shadow-lg shadow-primary/20">
                  {infoStepNumber}
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                  Suas Informações
                </h2>
              </div>
              <Card className="p-6 md:p-8 space-y-6">
                <Input
                  label="Como podemos te chamar?"
                  id="name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="h-14 rounded-2xl"
                  icon={<FaUser size={14} />}
                  required
                />

                <div className="space-y-2">
                  <Input
                    label="WhatsApp para contato"
                    type="tel"
                    id="whatsapp"
                    value={whatsappDigits ? formatBrazilPhoneForInput(whatsappDigits) : ""}
                    onChange={(e) => setWhatsappDigits(normalizeBrazilPhoneDigits(e.target.value))}
                    placeholder={BRAZIL_PHONE_PLACEHOLDER}
                    className="h-14 rounded-2xl"
                    icon={<FaPhoneAlt size={14} />}
                    required
                  />
                  {!isWhatsappValid && whatsappDigits.length > 0 && (
                    <p className="px-1 text-[10px] font-bold text-destructive uppercase tracking-widest">
                      Informe o número com DDD (ex: 11 99999-9999)
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleConfirm}
                    disabled={!isFormValid || isSubmitting}
                    className="h-16 w-full text-base font-black shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Reservando...
                      </div>
                    ) : (
                      "Confirmar Agendamento"
                    )}
                  </Button>
                  <p className="mt-4 text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Seguro • Rápido • Sem custos extras
                  </p>
                </div>
              </Card>
            </section>
          )}
        </div>

        <footer className="mt-20 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="rounded-2xl bg-muted p-4 opacity-50 ring-1 ring-border">
              <BrandLogo width={80} height={24} className="h-6 w-auto grayscale" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              © 2026 Agendo.me
            </p>
          </div>
        </footer>
      </div>
      {ToastComponent}
    </div>
  )
}
