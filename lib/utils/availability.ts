import { Availability, Appointment } from "@/types"
import { formatToLocalTime } from "./date"

export function generateSlots(availability: Availability, occupiedAppointments: Appointment[]): string[] {
  const { startTime, endTime, slotDuration } = availability
  const slots: string[] = []

  let current = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)

  while (current + slotDuration <= end) {
    const timeString = formatMinutesToTime(current)
    
    // Extract HH:mm using SP timezone
    const isOccupied = occupiedAppointments.some((app) => {
      const appTime = formatToLocalTime(app.date)
      return appTime === timeString
    })

    if (!isOccupied) {
      slots.push(timeString)
    }

    current += slotDuration
  }

  return slots
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}
