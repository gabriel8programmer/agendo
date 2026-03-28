import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Appointment from "@/models/Appointment"
import Availability from "@/models/Availability"
import { formatToLocalTime, dayjs } from "@/lib/utils/date"
import { parseTimeToMinutes } from "@/lib/utils/availability"
import { WorkInterval } from "@/types"

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

    // 2. Buscar configurações de disponibilidade
    const availability = await Availability.findOne({ userId })
    if (!availability) {
      return NextResponse.json(
        { error: "Configurações de agenda não encontradas" },
        { status: 404 }
      )
    }

    // 3. Validar se o dia da semana está ativo
    const dateObj = dayjs.tz(date, "America/Sao_Paulo")
    const dayOfWeek = dateObj.day()
    if (!availability.workDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: "O profissional não atende neste dia da semana" },
        { status: 400 }
      )
    }

    // 4. Validar se está dentro do horário de expediente
    const requestedMinutes = parseTimeToMinutes(time)
    const startMinutes = parseTimeToMinutes(availability.startTime)
    const endMinutes = parseTimeToMinutes(availability.endTime)

    if (requestedMinutes < startMinutes || requestedMinutes >= endMinutes) {
      return NextResponse.json({ error: "Horário fora do expediente" }, { status: 400 })
    }

    // 5. Validar se cai em um horário reservado (pausa)
    const slotDuration = availability.slotDuration
    const slotEnd = requestedMinutes + slotDuration

    const isReserved = availability.reservedIntervals?.some((interval: WorkInterval) => {
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
    const existingAppointment = await Appointment.findOne({
      userId,
      time,
      date: { $regex: date.split("T")[0] }, // Busca agendamento no mesmo dia e hora
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: "Este horário já foi preenchido por outro cliente" },
        { status: 409 }
      )
    }

    // 7. Criar agendamento
    // Deixe o MongoDB gerar o _id (ObjectId). Forçar string aqui causa erro de cast.
    const appointment = await Appointment.create(body)
    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar agendamento:", error)
    if (error instanceof Error && (error.name === "CastError" || error.name === "ValidationError")) {
      return NextResponse.json({ error: "Dados de agendamento inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
