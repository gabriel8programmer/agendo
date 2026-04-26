export interface User {
  id: string
  name: string
  companyName?: string
  slug: string
  slugLocked?: boolean
  email?: string
  createdAt?: string
}

export interface Service {
  _id?: string
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
  professionalId?: string
  clientName: string
  clientWhatsapp?: string
  date: string // ISO UTC (ex: 2026-03-20T09:00:00.000Z)
  time?: string // HH:mm format
  createdAt: string
}

export interface WorkInterval {
  startTime: string
  endTime: string
}

export interface Availability {
  id: string
  userId: string
  slotDuration: number
  startTime: string
  endTime: string
  workDays: number[]
  reservedIntervals: WorkInterval[]
}

export interface ProfessionalAvailability {
  slotDuration: number
  startTime: string
  endTime: string
  workDays: number[]
  reservedIntervals: WorkInterval[]
}

export interface Professional {
  id: string
  userId: string
  name: string
  whatsapp?: string
  isActive: boolean
  serviceIds: string[]
  availability: ProfessionalAvailability
  photoUrl?: string
  createdAt: string
}
