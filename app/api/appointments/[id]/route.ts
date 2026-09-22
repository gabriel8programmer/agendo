import { NextRequest, NextResponse } from "next/server"
import { Types } from "mongoose"
import dbConnect from "@/lib/mongoose"
import Appointment from "@/models/Appointment"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth"
import { trackServerEvent } from "@/lib/telemetry/server"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de agendamento inválido" }, { status: 400 })
    }

    const token = req.cookies.get(SESSION_COOKIE)?.value
    const session = token ? verifySessionToken(token) : null
    const searchUserId = new URL(req.url).searchParams.get("userId")
    const userId = session?.userId || searchUserId

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const appointment = await Appointment.findOne({ _id: id, userId })
    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }

    await Appointment.deleteOne({ _id: id, userId })
    trackServerEvent("appointment_cancelled", { id, userId })

    return NextResponse.json({ success: true, message: "Agendamento cancelado com sucesso" })
  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
