import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Service from "@/models/Service"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    const services = await Service.find({ userId }).sort({ createdAt: -1 })
    return NextResponse.json(services)
  } catch (error) {
    console.error("Erro ao buscar serviços:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = await req.json()

    if (!body.userId || !body.name || !body.duration) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    // Garantia extra: se o body não tiver _id, geramos um aqui
    // Isso resolve o erro "document must have an _id" se o hot-reload do schema falhar
    if (!body._id && !body.id) {
      body._id = `service_${Math.random().toString(36).substr(2, 9)}`
    }

    const service = await Service.create(body)
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar serviço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
