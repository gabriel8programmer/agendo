import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Availability from "@/models/Availability"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const body = await req.json()

    const availability = await Availability.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })

    if (!availability) {
      return NextResponse.json({ error: "Disponibilidade não encontrada" }, { status: 404 })
    }

    const payload = availability.toObject()
    const idCandidate = availability._id || payload._id || payload.id
    const normalizedId = idCandidate ? String(idCandidate).trim() : ""

    if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
      return NextResponse.json({ error: "Disponibilidade sem identificador válido" }, { status: 500 })
    }

    return NextResponse.json({
      id: normalizedId,
      userId: payload.userId,
      slotDuration: payload.slotDuration,
      startTime: payload.startTime,
      endTime: payload.endTime,
      workDays: payload.workDays || [],
      reservedIntervals: payload.reservedIntervals || [],
    })
  } catch (error) {
    console.error("Erro ao atualizar disponibilidade:", error)
    if (error instanceof Error && error.name === "CastError") {
      return NextResponse.json({ error: "ID inválido fornecido." }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
