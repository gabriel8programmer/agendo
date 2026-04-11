"use client"

import { useState, useEffect, use } from "react"
import { FaClock, FaTag, FaCheck, FaPhoneAlt, FaUser, FaMoon, FaSun } from "react-icons/fa"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import BrandLogo from "@/components/ui/BrandLogo"
import {
  getUserBySlug,
  getServices,
  getAvailability,
  getAppointments,
  createAppointment,
} from "@/lib/api"
import { generateSlots } from "@/lib/utils/availability"
import { User, Service, Availability, Appointment } from "@/types"
import { formatToUTC, getTodayDate, dayjs } from "@/lib/utils/date"
import { useToast } from "@/components/ui/Toast"
import { useTheme } from "@/components/providers/ThemeProvider"

const BRAZIL_COUNTRY_CODE = "55"
const BRAZIL_PHONE_PLACEHOLDER = "+55 (__) _____-____"

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

  if (!area) return "+55 "
  if (!local) return `+55 (${area}`

  if (local.length <= 4) {
    return `+55 (${area}) ${local}`
  }

  if (local.length <= 8) {
    return `+55 (${area}) ${local.slice(0, 4)}-${local.slice(4)}`
  }

  return `+55 (${area}) ${local.slice(0, 5)}-${local.slice(5, 9)}`
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
  const isDark = theme === "dark"

  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState("")
  const [whatsappDigits, setWhatsappDigits] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const userData = await getUserBySlug(slug)
        if (userData) {
          const userId = userData.id || (userData as User & { _id?: string })._id || ""
          if (!userId) {
            console.error("Usuário sem id: resposta da API /users/[slug] incompleta", userData)
            setLoading(false)
            return
          }
          const normalizedUser: User = {
            ...userData,
            id: String(userId),
          }
          setUser(normalizedUser)
          const [servicesData, availabilityData] = await Promise.all([
            getServices(normalizedUser.id),
            getAvailability(normalizedUser.id),
          ])
          setServices(servicesData)
          setAvailability(availabilityData)
        }
      } catch (error) {
        console.error("Error loading user/services/availability:", error)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans text-center">
        <p className="text-zinc-600 text-sm">Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans text-center">
        <Card className="p-8">
          <h1 className="text-xl font-bold text-zinc-900">Página não encontrada</h1>
          <p className="mt-2 text-zinc-600 text-sm">O negócio solicitado não existe.</p>
        </Card>
      </div>
    )
  }

  if (isConfirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans text-center">
        <Card className="p-8 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <FaCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Agendamento confirmado!</h1>
          <p className="mt-2 text-zinc-600 font-medium">
            Obrigado, {clientName}. Seu horário foi reservado.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => {
              setIsConfirmed(false)
              setSelectedService(null)
              setSelectedTime(null)
              setSelectedDate(getTodayDate())
              setClientName("")
              setWhatsappDigits("")
            }}
          >
            Novo agendamento
          </Button>
        </Card>
      </div>
    )
  }

  const availableTimes = availability
    ? generateSlots(availability, occupiedAppointments, selectedDate)
    : []
  const isWhatsappValid = whatsappDigits.length === 10 || whatsappDigits.length === 11
  const isFormValid =
    selectedService &&
    selectedTime &&
    clientName.trim().length > 0 &&
    selectedDate &&
    isWhatsappValid

  const handleConfirm = async () => {
    if (!selectedService || !selectedTime || !user || !selectedDate || !isWhatsappValid) return

    try {
      await createAppointment({
        userId: user.id,
        serviceId: selectedService,
        clientName,
        clientWhatsapp: toE164BrazilPhone(whatsappDigits),
        date: formatToUTC(selectedDate, selectedTime),
      })
      setIsConfirmed(true)
      showToast("Agendamento realizado com sucesso!", "success")
    } catch (error) {
      console.error("Error creating appointment:", error)
      showToast("Erro ao confirmar agendamento.", "error")
    }
  }

  // Generate next 14 days, filtering based on availability config
  const generateAvailableDates = () => {
    const dates = []
    const today = dayjs().tz("America/Sao_Paulo").startOf("day")

    for (let i = 0; i < 14; i++) {
      const date = today.add(i, "day")
      const dayOfWeek = date.day()

      // Filtro simplificado: verifica se o dia está no array workDays
      const isDayOpen = availability?.workDays?.includes(dayOfWeek) ?? false

      if (isDayOpen) {
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

  return (
    <div className="min-h-screen bg-[#f9fafb] p-4 font-sans md:p-8">
      <div className="mx-auto max-w-xl">
        <header className="mb-10 text-center">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50"
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {theme === "dark" ? <FaSun size={16} /> : <FaMoon size={16} />}
            </button>
          </div>
          <div className="mb-4 flex justify-center">
            <BrandLogo width={132} height={40} className="h-8 w-auto opacity-50" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            {user.companyName || user.name}
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-600 uppercase tracking-widest">
            Agende seu horário em segundos
          </p>
        </header>

        <div className="space-y-6">
          {/* 1. Serviços */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-zinc-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                1
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider">Selecione o Serviço</h2>
            </div>
            <div className="grid gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                    selectedService === service.id
                      ? isDark
                        ? "border-zinc-500 bg-zinc-100 text-zinc-900 shadow-md ring-1 ring-zinc-500"
                        : "border-zinc-900 bg-zinc-900 text-white shadow-md"
                      : isDark
                        ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500 shadow-sm"
                        : "border-zinc-100 bg-white text-zinc-900 hover:border-zinc-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        selectedService === service.id
                          ? isDark
                            ? "bg-zinc-900 text-zinc-100"
                            : "bg-white/10 text-white"
                          : isDark
                            ? "bg-zinc-800 text-zinc-400"
                            : "bg-zinc-50 text-zinc-400"
                      }`}
                    >
                      <FaTag size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{service.name}</p>
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          selectedService === service.id
                            ? isDark
                              ? "text-zinc-700"
                              : "text-zinc-300"
                            : "text-zinc-500"
                        }`}
                      >
                        <FaClock size={10} />
                        <span>{service.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.price && <p className="text-sm font-bold">R$ {service.price}</p>}
                    {selectedService === service.id && (
                      <FaCheck size={12} className={isDark ? "text-zinc-900" : "text-white"} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Data */}
          {selectedService && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-3 flex items-center gap-2 text-zinc-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                  2
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider">Escolha o Dia</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {availableDates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => setSelectedDate(date.value)}
                    className={`flex min-w-[80px] flex-col items-center rounded-xl border p-3 transition-all ${
                      selectedDate === date.value
                        ? isDark
                          ? "border-zinc-500 bg-zinc-100 text-zinc-900 shadow-md ring-1 ring-zinc-500"
                          : "border-zinc-900 bg-zinc-900 text-white shadow-md"
                        : isDark
                          ? "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                          : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
                      {date.isToday ? "Hoje" : date.label.split(" ")[0]}
                    </span>
                    <span className="text-sm font-bold capitalize">
                      {date.label.split(" ").slice(1).join(" ")}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 3. Horários */}
          {selectedService && selectedDate && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-3 flex items-center gap-2 text-zinc-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                  3
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider">Escolha o Horário</h2>
              </div>
              <Card className="p-4">
                {availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableTimes.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.isAvailable && setSelectedTime(slot.time)}
                        disabled={!slot.isAvailable}
                        className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                          !slot.isAvailable
                            ? "border-zinc-50 bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-60"
                            : selectedTime === slot.time
                              ? isDark
                                ? "border-zinc-500 bg-zinc-100 text-zinc-900 shadow-md ring-1 ring-zinc-500"
                                : "border-zinc-900 bg-zinc-900 text-white shadow-md"
                              : isDark
                                ? "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
                                : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-zinc-500 py-4 italic">
                    Nenhum horário disponível para este dia.
                  </p>
                )}
              </Card>
            </section>
          )}

          {/* 4. Seus Dados */}
          {selectedTime && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-3 flex items-center gap-2 text-zinc-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                  4
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider">Confirme Seus Dados</h2>
              </div>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-[calc(50%+10px)] z-10 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                      <FaUser size={12} />
                    </span>
                    <Input
                      label="Seu Nome"
                      id="name"
                      name="name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nome completo"
                      className="pl-12"
                      required
                    />
                  </div>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-[calc(50%+10px)] z-10 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                      <FaPhoneAlt size={12} />
                    </span>
                    <Input
                      label="WhatsApp"
                      type="tel"
                      id="whatsapp"
                      name="whatsapp"
                      value={whatsappDigits ? formatBrazilPhoneForInput(whatsappDigits) : ""}
                      onChange={(e) => setWhatsappDigits(normalizeBrazilPhoneDigits(e.target.value))}
                      placeholder={BRAZIL_PHONE_PLACEHOLDER}
                      className="pl-12"
                      required
                    />
                  </div>
                  {!isWhatsappValid && (
                    <p className="text-xs text-red-500">
                      Informe um número válido com DDD (ex: +55 (11) 91234-5678).
                    </p>
                  )}

                  <Button
                    onClick={handleConfirm}
                    disabled={!isFormValid}
                    className="mt-4 w-full py-4 text-base active:scale-[0.98]"
                  >
                    Confirmar Agendamento
                  </Button>
                </div>
              </Card>
            </section>
          )}
        </div>

        <footer className="mt-12">
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center">
            <BrandLogo width={72} height={22} className="h-5 w-auto" />
            <p className="text-xs text-zinc-500">Agendamento simples e rápido para seus clientes.</p>
          </div>
        </footer>
      </div>
      {ToastComponent}
    </div>
  )
}
