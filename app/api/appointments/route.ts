import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Appointment from "@/models/Appointment"
import Availability from "@/models/Availability"
import Professional from "@/models/Professional"
import { formatToLocalTime, dayjs } from "@/lib/utils/date"
import { parseTimeToMinutes } from "@/lib/utils/availability"
import { WorkInterval } from "@/types"
import { trackServerEvent } from "@/lib/telemetry/server"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const date_gte = searchParams.get("date_gte")
    const date_lte = searchParams.get("date_lte")

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    const query: {
      userId: string
      date?: { $gte?: string; $lte?: string }
    } = { userId }

    if (date_gte || date_lte) {
      query.date = {}
      if (date_gte) query.date.$gte = date_gte
      if (date_lte) query.date.$lte = date_lte
    }

    const appointments = await Appointment.find(query).sort({ date: 1, time: 1 })
    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = await req.json()

    // 1. Extração do horário se necessário
    if (!body.time && body.date) {
      try {
        body.time = formatToLocalTime(body.date)
      } catch (e) {
        console.error("Erro ao extrair time da data:", e)
      }
    }

    const { userId, date, time, clientName, serviceId } = body

    if (!userId || !serviceId || !clientName || !date || !time) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    // 2. Validar se a data e o horário não estão no passado
    const now = dayjs().tz("America/Sao_Paulo")
    const dateObj = dayjs.tz(date, "America/Sao_Paulo")
    const requestedMinutes = parseTimeToMinutes(time)
    const isToday = dateObj.isSame(now, "day")
    const nowMinutes = now.hour() * 60 + now.minute()

    if (dateObj.isBefore(now, "day") || (isToday && requestedMinutes <= nowMinutes)) {
      return NextResponse.json(
        { error: "Não é possível agendar em um horário que já passou" },
        { status: 400 }
      )
    }

    // 3. Buscar configurações de disponibilidade (Profissional ou Barbearia)
    let activeAvailability: {
      slotDuration: number
      startTime: string
      endTime: string
      workDays: number[]
      reservedIntervals: WorkInterval[]
    } | null = null

    if (
      body.professionalId &&
      typeof body.professionalId === "string" &&
      body.professionalId.trim() !== "" &&
      body.professionalId !== "any"
    ) {
      try {
        const prof = await Professional.findOne({ _id: body.professionalId, userId })
        if (
          prof?.availability &&
          Array.isArray(prof.availability.workDays) &&
          prof.availability.workDays.length > 0
        ) {
          activeAvailability = {
            slotDuration: prof.availability.slotDuration || 30,
            startTime: prof.availability.startTime || "09:00",
            endTime: prof.availability.endTime || "18:00",
            workDays: prof.availability.workDays,
            reservedIntervals: prof.availability.reservedIntervals || [],
          }
        }
      } catch (e) {
        console.warn("Não foi possível buscar disponibilidade do profissional:", e)
      }
    }

    if (!activeAvailability) {
      let bizAvailability = await Availability.findOne({ userId })
      if (!bizAvailability) {
        try {
          bizAvailability = await Availability.create({
            userId,
            slotDuration: 30,
            startTime: "09:00",
            endTime: "18:00",
            workDays: [1, 2, 3, 4, 5],
            reservedIntervals: [],
          })
        } catch {
          bizAvailability = await Availability.findOne({ userId })
        }
      }

      if (bizAvailability) {
        activeAvailability = {
          slotDuration: bizAvailability.slotDuration || 30,
          startTime: bizAvailability.startTime || "09:00",
          endTime: bizAvailability.endTime || "18:00",
          workDays: bizAvailability.workDays || [1, 2, 3, 4, 5],
          reservedIntervals: bizAvailability.reservedIntervals || [],
        }
      } else {
        activeAvailability = {
          slotDuration: 30,
          startTime: "09:00",
          endTime: "18:00",
          workDays: [1, 2, 3, 4, 5],
          reservedIntervals: [],
        }
      }
    }

    // 4. Validar se o dia da semana está ativo
    const dayOfWeek = dateObj.day()
    if (!activeAvailability.workDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: "O profissional não atende neste dia da semana" },
        { status: 400 }
      )
    }

    // 5. Validar se está dentro do horário de expediente
    const startMinutes = parseTimeToMinutes(activeAvailability.startTime)
    const endMinutes = parseTimeToMinutes(activeAvailability.endTime)

    if (requestedMinutes < startMinutes || requestedMinutes >= endMinutes) {
      return NextResponse.json({ error: "Horário fora do expediente" }, { status: 400 })
    }

    // 6. Validar se cai em um horário reservado (pausa)
    const slotDuration = activeAvailability.slotDuration
    const slotEnd = requestedMinutes + slotDuration

    const isReserved = activeAvailability.reservedIntervals?.some((interval: WorkInterval) => {
      const resStart = parseTimeToMinutes(interval.startTime)
      const resEnd = parseTimeToMinutes(interval.endTime)
      return requestedMinutes < resEnd && slotEnd > resStart
    })

    if (isReserved) {
      return NextResponse.json(
        { error: "Este horário coincide com uma pausa do profissional" },
        { status: 400 }
      )
    }

    // 6. Validar CONFLITO: Já existe agendamento neste horário exato?
    // Extraímos apenas a data YYYY-MM-DD para garantir a busca correta se o campo date no banco for string formatada
    const conflictQuery: Record<string, unknown> = {
      userId,
      time,
      date: { $regex: date.split("T")[0] },
    }
    if (body.professionalId) {
      conflictQuery.professionalId = body.professionalId
    }

    const existingAppointment = await Appointment.findOne(conflictQuery)

    if (existingAppointment) {
      return NextResponse.json(
        { error: "Este horário já foi preenchido por outro cliente" },
        { status: 409 }
      )
    }

    // 7. Criar agendamento
    // Deixe o MongoDB gerar o _id (ObjectId). Forçar string aqui causa erro de cast.
    const appointment = await Appointment.create(body)
    trackServerEvent("booking_confirmed", {
      has_whatsapp: Boolean(body.clientWhatsapp),
    })
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar agendamento:", error)
    if (
      error instanceof Error &&
      (error.name === "CastError" || error.name === "ValidationError")
    ) {
      return NextResponse.json({ error: "Dados de agendamento inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
