// app/agenda/page.tsx
import Card from "@/components/ui/Card"
import Header from "@/components/ui/Header"
import { FaChevronLeft, FaChevronRight, FaClock, FaUser, FaPlus } from "react-icons/fa"

interface TimeSlot {
  id: string
  time: string
  status: "available" | "booked"
  clientName?: string
  serviceName?: string
}

const mockTimeSlots: TimeSlot[] = [
  { id: "1", time: "08:00", status: "available" },
  {
    id: "2",
    time: "09:00",
    status: "booked",
    clientName: "Maria Silva",
    serviceName: "Corte + Barba",
  },
  { id: "3", time: "10:00", status: "available" },
  { id: "4", time: "11:00", status: "available" },
  { id: "5", time: "12:00", status: "booked", clientName: "Carlos Oliveira", serviceName: "Barba" },
  { id: "6", time: "13:00", status: "available" },
  { id: "7", time: "14:00", status: "available" },
  { id: "8", time: "15:00", status: "booked", clientName: "João Santos", serviceName: "Corte" },
  { id: "9", time: "16:00", status: "available" },
  { id: "10", time: "17:00", status: "available" },
  { id: "11", time: "18:00", status: "available" },
]

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
  const todayLabel = "Quarta-feira, 18 de Março"

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      <Header />
      <main className="mx-auto max-w-2xl p-4">
        <header className="mb-6 flex flex-col items-center gap-4">
          <div className="flex w-full items-center justify-between rounded-2xl bg-white p-2 shadow-sm border border-zinc-100">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors">
              <FaChevronLeft size={14} />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-zinc-900">{todayLabel}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Agenda do Dia
              </p>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors">
              <FaChevronRight size={14} />
            </button>
          </div>
        </header>

        <Card className="p-4 sm:p-6">
          <div className="space-y-3">
            {mockTimeSlots.map((slot) => (
              <SlotItem key={slot.id} slot={slot} />
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
