import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Service from "@/models/Service"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params
    const body = (await req.json()) as {
      name?: string
      duration?: number
      price?: number | null
    }

    if (!id) {
      return NextResponse.json({ error: "ID do serviço é obrigatório" }, { status: 400 })
    }

    const updateData: {
      name?: string
      duration?: number
      price?: number | null
    } = {}

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (!name) {
        return NextResponse.json({ error: "Nome do serviço inválido" }, { status: 400 })
      }
      updateData.name = name
    }

    if (body.duration !== undefined) {
      const duration = Number(body.duration)
      if (!Number.isFinite(duration) || duration <= 0) {
        return NextResponse.json({ error: "Duração inválida" }, { status: 400 })
      }
      updateData.duration = duration
    }

    if (body.price !== undefined) {
      if (body.price === null) {
        updateData.price = null
      } else {
        const price = Number(body.price)
        if (!Number.isFinite(price) || price < 0) {
          return NextResponse.json({ error: "Preço inválido" }, { status: 400 })
        }
        updateData.price = price
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    const service = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!service) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error)
    if (error instanceof Error && error.name === "CastError") {
      return NextResponse.json({ error: "ID inválido fornecido." }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
