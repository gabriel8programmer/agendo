import { NextRequest, NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/mongoose"
import Professional from "@/models/Professional"
import Service from "@/models/Service"
import { WorkInterval } from "@/types"

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5]

type AvailabilityInput = {
  slotDuration?: unknown
  startTime?: unknown
  endTime?: unknown
  workDays?: unknown
  reservedIntervals?: unknown
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function sanitizeServiceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter((id) => id !== "" && id !== "undefined" && id !== "null")
    )
  )
}

function normalizeAvailability(input: AvailabilityInput | undefined) {
  const slotDurationRaw = Number(input?.slotDuration ?? 30)
  const slotDuration =
    Number.isFinite(slotDurationRaw) && slotDurationRaw > 0 ? Math.round(slotDurationRaw) : 30

  const startTimeRaw = typeof input?.startTime === "string" ? input.startTime.trim() : "09:00"
  const endTimeRaw = typeof input?.endTime === "string" ? input.endTime.trim() : "18:00"

  if (!TIME_PATTERN.test(startTimeRaw) || !TIME_PATTERN.test(endTimeRaw)) {
    throw new Error("Horário de disponibilidade inválido")
  }

  if (parseTimeToMinutes(startTimeRaw) >= parseTimeToMinutes(endTimeRaw)) {
    throw new Error("Horário de início deve ser menor que o horário de término")
  }

  const workDays = Array.isArray(input?.workDays)
    ? Array.from(
        new Set(
          input.workDays
            .map((day) => Number(day))
            .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        )
      ).sort((a, b) => a - b)
    : DEFAULT_WORK_DAYS

  const reservedIntervals = Array.isArray(input?.reservedIntervals)
    ? input.reservedIntervals
        .map((interval) => {
          const obj = interval as Partial<WorkInterval>
          const startTime = typeof obj.startTime === "string" ? obj.startTime.trim() : ""
          const endTime = typeof obj.endTime === "string" ? obj.endTime.trim() : ""
          if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) return null
          if (parseTimeToMinutes(startTime) >= parseTimeToMinutes(endTime)) return null
          return { startTime, endTime }
        })
        .filter((interval): interval is WorkInterval => interval !== null)
    : []

  return {
    slotDuration,
    startTime: startTimeRaw,
    endTime: endTimeRaw,
    workDays: workDays.length > 0 ? workDays : DEFAULT_WORK_DAYS,
    reservedIntervals,
  }
}

async function assertServicesBelongToUser(userId: string, serviceIds: string[]) {
  if (serviceIds.length === 0) return
  const matchedCount = await Service.countDocuments({
    userId,
    _id: { $in: serviceIds },
  })
  if (matchedCount !== serviceIds.length) {
    throw new Error("Um ou mais serviços não pertencem à empresa")
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const body = (await req.json()) as {
      userId?: string
      name?: string
      whatsapp?: string
      isActive?: boolean
      serviceIds?: unknown
      availability?: AvailabilityInput
      photoUrl?: string
    }

    const userId = typeof body.userId === "string" ? body.userId.trim() : ""
    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de profissional inválido" }, { status: 400 })
    }

    const professional = await Professional.findOne({ _id: id, userId })
    if (!professional) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 })
    }

    if (typeof body.name === "string") {
      const name = body.name.trim()
      if (!name) {
        return NextResponse.json({ error: "Nome do profissional é obrigatório" }, { status: 400 })
      }
      professional.name = name
    }

    if (typeof body.whatsapp === "string") {
      professional.whatsapp = body.whatsapp.trim()
    }

    if (typeof body.photoUrl === "string") {
      professional.photoUrl = body.photoUrl.trim()
    }

    if (typeof body.isActive === "boolean") {
      professional.isActive = body.isActive
    }

    if (body.serviceIds !== undefined) {
      const serviceIds = sanitizeServiceIds(body.serviceIds)
      await assertServicesBelongToUser(userId, serviceIds)
      professional.serviceIds = serviceIds
    }

    if (body.availability !== undefined) {
      professional.availability = normalizeAvailability(body.availability)
    }

    await professional.save()
    return NextResponse.json(professional)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Erro ao atualizar profissional:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
