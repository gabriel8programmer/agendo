export interface User {
  id: string
  name: string
  slug: string
  email?: string
  createdAt: string
}

export interface Service {
  id: string
  userId: string
  name: string
  duration: number // em minutos
  price?: number
  createdAt: string
}

export interface Appointment {
  id: string
  userId: string
  serviceId: string
  clientName: string
  clientWhatsapp?: string
  date: string // ISO UTC (ex: 2026-03-20T09:00:00.000Z)
  createdAt: string
}

export interface Availability {
  id: string
  userId: string
  startTime: string // "09:00"
  endTime: string // "18:00"
  slotDuration: number // ex: 30
}