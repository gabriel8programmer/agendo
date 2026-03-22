import { User, Service, Appointment, Availability } from "@/types"
import { getDayRangeUTC } from "@/lib/utils/date"

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "" // Browser should use relative
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000" // Default for local dev
}

const BASE_URL = `${getBaseUrl()}/api`

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text()
    console.error(`Fetch error ${res.status} for ${url}:`, text.slice(0, 100))
    throw new Error(`Fetch error ${res.status}`)
  }
  const contentType = res.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text()
    console.error(`Expected JSON but got ${contentType} for ${url}:`, text.slice(0, 100))
    throw new Error("Response was not JSON")
  }
  return res.json()
}

export async function getUserBySlug(slug: string): Promise<User | null> {
  try {
    const url = `${BASE_URL}/users/${slug}`
    const res = await fetch(url)
    if (res.status === 404) return null
    if (!res.ok) {
      const text = await res.text()
      console.error(`Fetch error ${res.status} for getUserBySlug:`, text.slice(0, 100))
      return null
    }
    const contentType = res.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`Expected JSON for getUserBySlug but got ${contentType}`)
      return null
    }
    return res.json()
  } catch (error) {
    console.error("getUserBySlug error:", error)
    return null
  }
}

export async function getServices(userId: string): Promise<Service[]> {
  return fetchJson(`${BASE_URL}/services?userId=${userId}`)
}

export async function createService(data: Omit<Service, "id" | "createdAt">): Promise<Service> {
  return fetchJson(`${BASE_URL}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      createdAt: new Date().toISOString(),
    }),
  })
}

/**
 * @param date YYYY-MM-DD
 */
export async function getAppointments(userId: string, date: string): Promise<Appointment[]> {
  const { start, end } = getDayRangeUTC(date)

  return fetchJson(`${BASE_URL}/appointments?userId=${userId}&date_gte=${start}&date_lte=${end}`)
}

export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt">
): Promise<Appointment> {
  return fetchJson(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      createdAt: new Date().toISOString(),
    }),
  })
}

export async function getAvailability(userId: string): Promise<Availability | null> {
  try {
    const availabilities = await fetchJson(`${BASE_URL}/availability?userId=${userId}`)
    return Array.isArray(availabilities) && availabilities.length > 0 ? availabilities[0] : null
  } catch (error) {
    console.error("getAvailability error:", error)
    return null
  }
}

export async function updateAvailability(
  id: string,
  data: Partial<Availability>
): Promise<Availability> {
  return fetchJson(`${BASE_URL}/availability/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}
