import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Appointment from "@/models/Appointment"
import Service from "@/models/Service"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth"
import { dayjs } from "@/lib/utils/date"
import { ClientSummary } from "@/types"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.cookies.get(SESSION_COOKIE)?.value
    const session = token ? verifySessionToken(token) : null
    const searchUserId = new URL(req.url).searchParams.get("userId")
    const userId = session?.userId || searchUserId

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    const [appointments, services] = await Promise.all([
      Appointment.find({ userId }).sort({ date: -1 }).lean(),
      Service.find({ userId }).lean(),
    ])

    const serviceMap = new Map<string, string>()
    for (const s of services) {
      serviceMap.set(String(s._id), s.name)
    }

    const clientGroups = new Map<
      string,
      {
        name: string
        whatsapp?: string
        appointments: Array<{
          id: string
          serviceId: string
          date: string
        }>
      }
    >()

    for (const app of appointments) {
      let cleanPhone = app.clientWhatsapp ? app.clientWhatsapp.replace(/\D/g, "") : ""
      if (cleanPhone.startsWith("55") && cleanPhone.length > 11) {
        cleanPhone = cleanPhone.slice(2)
      }
      const key = cleanPhone ? `phone_${cleanPhone}` : `name_${app.clientName.trim().toLowerCase()}`

      let group = clientGroups.get(key)
      if (!group) {
        group = {
          name: app.clientName.trim(),
          whatsapp: app.clientWhatsapp,
          appointments: [],
        }
        clientGroups.set(key, group)
      } else {
        if (!group.whatsapp && app.clientWhatsapp) {
          group.whatsapp = app.clientWhatsapp
        }
      }

      group.appointments.push({
        id: String(app._id),
        serviceId: app.serviceId,
        date: app.date,
      })
    }

    const now = dayjs().tz("America/Sao_Paulo")
    const clients: ClientSummary[] = []

    for (const [id, group] of clientGroups.entries()) {
      group.appointments.sort((a, b) => b.date.localeCompare(a.date))
      const latestApp = group.appointments[0]
      const earliestApp = group.appointments[group.appointments.length - 1]

      const latestDay = dayjs(latestApp.date).tz("America/Sao_Paulo")
      const isFuture = latestDay.isAfter(now)
      const daysSinceLastVisit = isFuture ? 0 : Math.max(0, now.diff(latestDay, "day"))

      let status: ClientSummary["status"] = "active"
      if (isFuture) {
        status = "upcoming"
      } else if (daysSinceLastVisit > 40) {
        status = "inactive"
      } else if (daysSinceLastVisit > 20) {
        status = "warning"
      } else {
        status = "active"
      }

      clients.push({
        id,
        name: group.name,
        whatsapp: group.whatsapp,
        totalAppointments: group.appointments.length,
        lastAppointmentDate: latestApp.date,
        firstAppointmentDate: earliestApp.date,
        lastServiceName: serviceMap.get(latestApp.serviceId) || "Atendimento",
        daysSinceLastVisit,
        status,
      })
    }

    clients.sort((a, b) => b.lastAppointmentDate.localeCompare(a.lastAppointmentDate))

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Erro ao listar clientes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
