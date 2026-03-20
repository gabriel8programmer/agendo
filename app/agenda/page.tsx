"use client"

import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import { FaChevronLeft, FaChevronRight, FaClock, FaUser, FaPlus } from "react-icons/fa"
import { getAvailability, getAppointments, getServices } from "@/lib/api"
import { formatToLocalTime, dayjs } from "@/lib/utils/date"

interface TimeSlot {
  id: string
  time: string
  status: "available" | "booked"
  clientName?: string
  serviceName?: string
}

function SlotItem({ slot }: { slot: TimeSlot }) {
  const isAvailable = slot.status === "available"

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
        <div className="rounded-lg bg-zinc-200 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-zinc-600">
          Ocupado
        </div>
      )}
    </div>
  )
}

export default function AgendaPage() {
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [date, setDate] = useState(dayjs().tz("America/Sao_Paulo"))
  const userId = "user-1"

  useEffect(() => {
    async function loadAgenda() {
      setLoading(true)
      try {
        const dateString = date.format("YYYY-MM-DD")
        const [availability, appointments, services] = await Promise.all([
          getAvailability(userId),
          getAppointments(userId, dateString),
          getServices(userId),
        ])

        if (availability) {
          const generatedSlots: TimeSlot[] = []
          let current = parseTimeToMinutes(availability.startTime)
          const end = parseTimeToMinutes(availability.endTime)

          while (current + availability.slotDuration <= end) {
            const timeString = formatMinutesToTime(current)
            const appointment = appointments.find((app) => {
              const appTime = formatToLocalTime(app.date)
              return appTime === timeString
            })

            if (appointment) {
              const service = services.find((s) => s.id === appointment.serviceId)
              generatedSlots.push({
                id: appointment.id,
                time: timeString,
                status: "booked",
                clientName: appointment.clientName,
                serviceName: service?.name || "Serviço não encontrado",
              })
            } else {
              generatedSlots.push({
                id: timeString,
                time: timeString,
                status: "available",
              })
            }
            current += availability.slotDuration
          }
          setSlots(generatedSlots)
        }
      } catch (error) {
        console.error("Error loading agenda:", error)
      } finally {
        setLoading(false)
      }
    }
    loadAgenda()
  }, [date])

  const todayLabel = date.format("dddd, D [de] MMMM")

  function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number)
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
          {loading ? (
            <p className="text-center text-sm text-zinc-500">Carregando...</p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => (
                <SlotItem key={slot.id} slot={slot} />
              ))}
              {slots.length === 0 && (
                <p className="text-center text-sm text-zinc-500">Nenhum horário disponível para este dia.</p>
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
