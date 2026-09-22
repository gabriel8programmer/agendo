import request from "supertest"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/appointments/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import Appointment from "@/models/Appointment"
import Availability from "@/models/Availability"
import Professional from "@/models/Professional"
import dbConnect from "@/lib/mongoose"
import { dayjs } from "@/lib/utils/date"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/Appointment", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock("@/models/Availability", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock("@/models/Professional", () => ({
  default: {
    findOne: vi.fn(),
  },
}))

vi.mock("@/lib/telemetry/server", () => ({
  trackServerEvent: vi.fn(),
}))

describe("API /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  describe("GET", () => {
    it("returns 400 if userId is missing", async () => {
      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/appointments")
      expect(res.status).toBe(400)
      expect(res.body.error).toBe("userId é obrigatório")
    })

    it("returns appointments for a given userId", async () => {
      const mockAppointments = [
        {
          _id: "app-1",
          userId: "user-1",
          serviceId: "service-1",
          clientName: "Cliente 1",
          time: "10:00",
          date: "2026-09-23T13:00:00.000Z",
        },
      ]

      vi.mocked(Appointment.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockAppointments),
      } as never)

      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/appointments?userId=user-1")

      expect(res.status).toBe(200)
      expect(res.body).toEqual(mockAppointments)
    })
  })

  describe("POST", () => {
    it("returns 400 if required fields are missing", async () => {
      const server = createRouteTestServer(POST)
      const res = await request(server).post("/api/appointments").send({
        userId: "user-1",
      })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe("Campos obrigatórios ausentes")
    })

    it("returns 400 if appointment date is in the past", async () => {
      const server = createRouteTestServer(POST)
      const pastDate = dayjs().tz("America/Sao_Paulo").subtract(1, "day").format("YYYY-MM-DD")

      const res = await request(server)
        .post("/api/appointments")
        .send({
          userId: "user-1",
          serviceId: "serv-1",
          clientName: "Cliente Antigo",
          date: `${pastDate}T10:00:00.000Z`,
          time: "10:00",
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe("Não é possível agendar em um horário que já passou")
    })

    it("returns 409 if appointment already exists at the requested time", async () => {
      const futureDate = dayjs().tz("America/Sao_Paulo").add(1, "day").startOf("day")
      // Garantir que seja um dia da semana útil (ex: terça-feira)
      const testDate =
        futureDate.day() === 0
          ? futureDate.add(1, "day")
          : futureDate.day() === 6
            ? futureDate.add(2, "day")
            : futureDate
      const dateStr = testDate.format("YYYY-MM-DD")

      vi.mocked(Availability.findOne).mockResolvedValue({
        slotDuration: 30,
        startTime: "09:00",
        endTime: "18:00",
        workDays: [1, 2, 3, 4, 5],
        reservedIntervals: [],
      } as never)

      vi.mocked(Appointment.findOne).mockResolvedValue({
        _id: "existing-app",
      } as never)

      const server = createRouteTestServer(POST)
      const res = await request(server)
        .post("/api/appointments")
        .send({
          userId: "user-1",
          serviceId: "serv-1",
          clientName: "Cliente Conflito",
          date: `${dateStr}T14:00:00.000Z`,
          time: "14:00",
        })

      expect(res.status).toBe(409)
      expect(res.body.error).toBe("Este horário já foi preenchido por outro cliente")
    })

    it("creates appointment and auto-creates availability if not found in database", async () => {
      const futureDate = dayjs().tz("America/Sao_Paulo").add(1, "day").startOf("day")
      const testDate =
        futureDate.day() === 0
          ? futureDate.add(1, "day")
          : futureDate.day() === 6
            ? futureDate.add(2, "day")
            : futureDate
      const dateStr = testDate.format("YYYY-MM-DD")

      // Primeira busca retorna null
      vi.mocked(Availability.findOne).mockResolvedValue(null as never)
      // Auto-create cria disponibilidade padrão
      vi.mocked(Availability.create).mockResolvedValue({
        slotDuration: 30,
        startTime: "09:00",
        endTime: "18:00",
        workDays: [1, 2, 3, 4, 5],
        reservedIntervals: [],
      } as never)

      vi.mocked(Appointment.findOne).mockResolvedValue(null as never)
      vi.mocked(Appointment.create).mockResolvedValue({
        id: "new-app-1",
        userId: "user-1",
        serviceId: "serv-1",
        clientName: "Gabriel",
        time: "14:00",
        date: `${dateStr}T14:00:00.000Z`,
      } as never)

      const server = createRouteTestServer(POST)
      const res = await request(server)
        .post("/api/appointments")
        .send({
          userId: "user-1",
          serviceId: "serv-1",
          clientName: "Gabriel",
          date: `${dateStr}T14:00:00.000Z`,
          time: "14:00",
        })

      expect(res.status).toBe(201)
      expect(Availability.create).toHaveBeenCalled()
      expect(Appointment.create).toHaveBeenCalled()
    })

    it("uses professional availability when professionalId is passed", async () => {
      const futureDate = dayjs().tz("America/Sao_Paulo").add(1, "day").startOf("day")
      const testDate =
        futureDate.day() === 0
          ? futureDate.add(1, "day")
          : futureDate.day() === 6
            ? futureDate.add(2, "day")
            : futureDate
      const dateStr = testDate.format("YYYY-MM-DD")

      vi.mocked(Professional.findOne).mockResolvedValue({
        _id: "prof-1",
        userId: "user-1",
        availability: {
          slotDuration: 45,
          startTime: "08:00",
          endTime: "20:00",
          workDays: [0, 1, 2, 3, 4, 5, 6],
          reservedIntervals: [],
        },
      } as never)

      vi.mocked(Appointment.findOne).mockResolvedValue(null as never)
      vi.mocked(Appointment.create).mockResolvedValue({
        id: "new-app-2",
        userId: "user-1",
        professionalId: "prof-1",
        serviceId: "serv-1",
        clientName: "Gabriel",
        time: "08:30",
        date: `${dateStr}T08:30:00.000Z`,
      } as never)

      const server = createRouteTestServer(POST)
      const res = await request(server)
        .post("/api/appointments")
        .send({
          userId: "user-1",
          professionalId: "prof-1",
          serviceId: "serv-1",
          clientName: "Gabriel",
          date: `${dateStr}T08:30:00.000Z`,
          time: "08:30",
        })

      expect(res.status).toBe(201)
      expect(Professional.findOne).toHaveBeenCalledWith({ _id: "prof-1", userId: "user-1" })
      expect(Appointment.create).toHaveBeenCalled()
    })
  })
})
