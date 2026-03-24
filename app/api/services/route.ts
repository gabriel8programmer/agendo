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

    const docs = await Service.find({ userId }).sort({ createdAt: -1 }).lean()
    const services = docs.map((d) => ({
      id: String(d._id),
      userId: d.userId,
      name: d.name,
      duration: d.duration,
      price: d.price,
      createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
    }))
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

    if (!body.userId || !body.name || body.duration === undefined || body.duration === null) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    const duration = Number(body.duration)
    if (!Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ error: "Duração inválida" }, { status: 400 })
    }

    // Não repassar _id/id/createdAt do cliente: o Mongoose gera ObjectId e timestamps.
    // Um _id string arbitrário (ex: "service_abc123") quebra o cast para ObjectId e gera 500.
    const payload: {
      userId: string
      name: string
      duration: number
      price?: number
    } = {
      userId: String(body.userId),
      name: String(body.name).trim(),
      duration,
    }

    if (body.price !== undefined && body.price !== null && body.price !== "") {
      const price = Number(body.price)
      if (Number.isFinite(price) && price >= 0) {
        payload.price = price
      }
    }

    const service = await Service.create(payload)
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar serviço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
