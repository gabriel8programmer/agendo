import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Availability from "@/models/Availability"

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

    return NextResponse.json([availability.toJSON()])
  } catch (error) {
    console.error("Erro ao buscar disponibilidade:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
