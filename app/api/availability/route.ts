import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Availability from "@/models/Availability"

function isValidId(value: unknown): boolean {
  if (typeof value !== "string") return false
  const normalized = value.trim()
  return normalized !== "" && normalized !== "undefined" && normalized !== "null"
}

function serializeAvailability(availability: {
  _id?: unknown
  toObject: () => Record<string, unknown>
}) {
  const payload = availability.toObject()
  const payloadWithId = payload as Record<string, unknown> & { _id?: unknown; id?: unknown }
  const idCandidate = availability._id || payloadWithId._id || payloadWithId.id
  const normalizedId = idCandidate ? String(idCandidate).trim() : ""

  return {
    id: isValidId(normalizedId) ? normalizedId : "",
    userId: String(payloadWithId.userId || ""),
    slotDuration: Number(payloadWithId.slotDuration || 30),
    startTime: String(payloadWithId.startTime || "09:00"),
    endTime: String(payloadWithId.endTime || "18:00"),
    workDays: Array.isArray(payloadWithId.workDays) ? payloadWithId.workDays : [],
    reservedIntervals: Array.isArray(payloadWithId.reservedIntervals)
      ? payloadWithId.reservedIntervals
      : [],
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    const availability = await Availability.findOne({ userId })

    if (!availability) {
      return NextResponse.json([])
    }

    const serialized = serializeAvailability(availability)
    return NextResponse.json([serialized])
  } catch (error) {
    console.error("Erro ao buscar disponibilidade:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect()
    const body = (await req.json()) as {
      userId?: string
      slotDuration?: number
      startTime?: string
      endTime?: string
      workDays?: number[]
      reservedIntervals?: { startTime: string; endTime: string }[]
    }

    const userId = typeof body.userId === "string" ? body.userId.trim() : ""
    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    const updateData = {
      slotDuration: body.slotDuration,
      startTime: body.startTime,
      endTime: body.endTime,
      workDays: body.workDays,
      reservedIntervals: body.reservedIntervals,
    }

    const availability = await Availability.findOneAndUpdate({ userId }, updateData, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    })

    const serialized = serializeAvailability(availability)
    return NextResponse.json(serialized)
  } catch (error) {
    console.error("Erro ao atualizar disponibilidade por userId:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
