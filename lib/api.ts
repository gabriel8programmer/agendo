import { User, Service, Appointment, Availability } from "@/types"
import { getDayRangeUTC } from "@/lib/utils/date"

const BASE_URL = "http://localhost:3001"

export async function getUserBySlug(slug: string): Promise<User | null> {
  const res = await fetch(`${BASE_URL}/users?slug=${slug}`)
  const users = await res.json()
  return users.length > 0 ? users[0] : null
}

export async function getServices(userId: string): Promise<Service[]> {
  const res = await fetch(`${BASE_URL}/services?userId=${userId}`)
  return res.json()
}

export async function createService(data: Omit<Service, "id" | "createdAt">): Promise<Service> {
  const res = await fetch(`${BASE_URL}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      createdAt: new Date().toISOString(),
    }),
  })
  return res.json()
}

/**
 * @param date YYYY-MM-DD
 */
export async function getAppointments(userId: string, date: string): Promise<Appointment[]> {
  const { start, end } = getDayRangeUTC(date)
  
  const res = await fetch(
    `${BASE_URL}/appointments?userId=${userId}&date_gte=${start}&date_lte=${end}`
  )
  return res.json()
}

export async function createAppointment(data: Omit<Appointment, "id" | "createdAt">): Promise<Appointment> {
  const res = await fetch(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      createdAt: new Date().toISOString(),
    }),
  })
  return res.json()
}

export async function getAvailability(userId: string): Promise<Availability | null> {
  const res = await fetch(`${BASE_URL}/availability?userId=${userId}`)
  const availabilities = await res.json()
  return availabilities.length > 0 ? availabilities[0] : null
}

export async function updateAvailability(id: string, data: Partial<Availability>): Promise<Availability> {
  const res = await fetch(`${BASE_URL}/availability/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}
