import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import Service from "@/models/Service"
import Appointment from "@/models/Appointment"
import Availability from "@/models/Availability"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    await dbConnect()

    // 1. Ler db.json
    const filePath = path.join(process.cwd(), "db.json")
    const fileData = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(fileData)

    // 2. Limpar coleções atuais
    await Promise.all([
      User.deleteMany({}),
      Service.deleteMany({}),
      Appointment.deleteMany({}),
      Availability.deleteMany({}),
    ])

    // 3. Inserir Usuários
    const users = data.users.map((u: { id: string; name: string; slug: string; createdAt: string }) => ({
      _id: u.id,
      name: u.name,
      slug: u.slug,
      createdAt: new Date(u.createdAt),
    }))
    await User.insertMany(users)

    // 4. Inserir Serviços
    const services = data.services.map((s: { id: string; userId: string; name: string; duration: number; price?: number; createdAt: string }) => ({
      _id: s.id,
      userId: s.userId,
      name: s.name,
      duration: s.duration,
      price: s.price,
      createdAt: new Date(s.createdAt),
    }))
    await Service.insertMany(services)

    // 5. Inserir Disponibilidade (Estrutura Simplificada)
    const availabilities = data.availability.map((a: { id: string; userId: string; slotDuration: number; startTime: string; endTime: string; workDays: number[]; reservedIntervals: { startTime: string; endTime: string }[] }) => ({
      _id: a.id,
      userId: a.userId,
      slotDuration: a.slotDuration,
      startTime: a.startTime,
      endTime: a.endTime,
      workDays: a.workDays,
      reservedIntervals: a.reservedIntervals,
    }))
    await Availability.insertMany(availabilities)

    // 6. Inserir Agendamentos
    const appointments = data.appointments.map((ap: { id: string; userId: string; serviceId: string; clientName: string; clientWhatsapp?: string; date: string; createdAt: string }) => ({
      _id: ap.id,
      userId: ap.userId,
      serviceId: ap.serviceId,
      clientName: ap.clientName,
      clientWhatsapp: ap.clientWhatsapp,
      date: ap.date,
      time: ap.date.includes("T") ? ap.date.split("T")[1].substring(0, 5) : "09:00",
      createdAt: new Date(ap.createdAt),
    }))
    if (appointments.length > 0) {
      await Appointment.insertMany(appointments)
    }

    return NextResponse.json({
      message: "Seed finalizado com sucesso!",
      stats: {
        users: users.length,
        services: services.length,
        availabilities: availabilities.length,
        appointments: appointments.length,
      },
    })
  } catch (error: unknown) {
    console.error("Erro no seed:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
