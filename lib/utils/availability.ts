import { Availability, Appointment } from "@/types"
import { formatToLocalTime, dayjs } from "./date"

export interface Slot {
  time: string
  isAvailable: boolean
}

export function generateSlots(
  availability: Availability,
  occupiedAppointments: Appointment[],
  selectedDate: string // YYYY-MM-DD
): Slot[] {
  const { workDays, slotDuration, startTime, endTime, reservedIntervals } = availability

  const dateObj = dayjs.tz(selectedDate, "America/Sao_Paulo")
  const dayOfWeek = dateObj.day()

  const isOpen = workDays?.includes(dayOfWeek)

  if (!isOpen) return []

  const slots: Slot[] = []
  let current = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)

  while (current + slotDuration <= end) {
    const timeString = formatMinutesToTime(current)
    const slotEnd = current + slotDuration

    // 1. Verificar se está em um horário reservado (PAUSA/ALMOÇO) -> HIDE
    const isReservedInterval = reservedIntervals?.some((interval) => {
      const resStart = parseTimeToMinutes(interval.startTime)
      const resEnd = parseTimeToMinutes(interval.endTime)
      return current < resEnd && slotEnd > resStart
    })

    if (!isReservedInterval) {
      // 2. Verificar se está ocupado por um agendamento -> DISABLE
      const isOccupied = occupiedAppointments.some((app) => {
        const appTime = app.time || formatToLocalTime(app.date)
        return appTime === timeString
      })

      slots.push({
        time: timeString,
        isAvailable: !isOccupied,
      })
    }

    current += slotDuration
  }

  return slots
}

export function parseTimeToMinutes(time: string): number {
  if (!time) return 0
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}
