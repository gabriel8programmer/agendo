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

    return NextResponse.json(availability)
  } catch (error) {
    console.error("Erro ao atualizar disponibilidade:", error)
    if (error instanceof Error && error.name === 'CastError') {
        return NextResponse.json({ error: "ID inválido fornecido." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
