"use client"

import { useState, useEffect, use } from "react"
import { Bungee_Shade } from "next/font/google"
import { FaClock, FaTag, FaCheck, FaPhoneAlt, FaUser } from "react-icons/fa"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
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

const agendoFont = Bungee_Shade({
  subsets: ["latin"],
  weight: ["400"],
})

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

  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
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
              setWhatsapp("")
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
  const isFormValid =
    selectedService && selectedTime && clientName.trim().length > 0 && selectedDate

  const handleConfirm = async () => {
    if (!selectedService || !selectedTime || !user || !selectedDate) return

    try {
      await createAppointment({
        userId: user.id,
        serviceId: selectedService,
        clientName,
        clientWhatsapp: whatsapp,
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
          <div className="mb-4 flex justify-center">
            <h2
              className={`${agendoFont.className} text-xl text-zinc-400 opacity-50 tracking-widest`}
            >
              Agendo
            </h2>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            {user.name}
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
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                      : "border-zinc-100 bg-white text-zinc-900 hover:border-zinc-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        selectedService === service.id
                          ? "bg-white/10 text-white"
                          : "bg-zinc-50 text-zinc-400"
                      }`}
                    >
                      <FaTag size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{service.name}</p>
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          selectedService === service.id ? "text-zinc-300" : "text-zinc-500"
                        }`}
                      >
                        <FaClock size={10} />
                        <span>{service.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.price && <p className="text-sm font-bold">R$ {service.price}</p>}
                    {selectedService === service.id && <FaCheck size={12} className="text-white" />}
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
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
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
                              ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
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
                    <FaUser className="absolute left-3 top-9.5 text-zinc-400" size={14} />
                    <Input
                      label="Seu Nome"
                      id="name"
                      name="name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nome completo"
                      className="pl-10"
                      required
                    />
                  </div>

                  <div className="relative">
                    <FaPhoneAlt className="absolute left-3 top-9.5 text-zinc-400" size={14} />
                    <Input
                      label="WhatsApp"
                      type="tel"
                      id="whatsapp"
                      name="whatsapp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="pl-10"
                      required
                    />
                  </div>

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

        <footer className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Powered by Agendo
        </footer>
      </div>
      {ToastComponent}
    </div>
  )
}
