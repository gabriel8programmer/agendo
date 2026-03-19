"use client"

// app/[slug]/page.tsx
import { useState } from "react"
import { useParams } from "next/navigation"
import { Bungee_Shade } from "next/font/google"
import { FaClock, FaTag, FaCheck, FaPhoneAlt, FaUser } from "react-icons/fa"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"

const agendoFont = Bungee_Shade({
  subsets: ["latin"],
  weight: ["400"],
})

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

const BUSINESS_SLUG = "barbearia-do-joao"
const BUSINESS_NAME = "Barbearia do João"

const SERVICES: Service[] = [
  { id: "s1", name: "Corte de cabelo", duration: 30, price: 30 },
  { id: "s2", name: "Barba", duration: 20, price: 20 },
  { id: "s3", name: "Corte + barba", duration: 50, price: 45 },
]

const AVAILABLE_TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00"]

export default function PublicBookingPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)

  if (slug !== BUSINESS_SLUG) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] p-4 font-sans text-center">
        <Card className="p-8">
          <h1 className="text-xl font-bold text-zinc-900">Página não encontrada</h1>
          <p className="mt-2 text-zinc-600">O negócio solicitado não existe.</p>
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

  const isFormValid = selectedService && selectedTime && clientName.trim().length > 0

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
            {BUSINESS_NAME}
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
              {SERVICES.map((service) => (
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
                    <p className="text-sm font-bold">R$ {service.price}</p>
                    {selectedService === service.id && <FaCheck size={12} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Horários */}
          {selectedService && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-3 flex items-center gap-2 text-zinc-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                  2
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider">Escolha o Horário</h2>
              </div>
              <Card className="p-4">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {AVAILABLE_TIMES.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                        selectedTime === time
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                          : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </Card>
            </section>
          )}

          {/* 3. Seus Dados */}
          {selectedTime && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-3 flex items-center gap-2 text-zinc-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                  3
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
                    onClick={() => setIsConfirmed(true)}
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
    </div>
  )
}
