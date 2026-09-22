import request from "supertest"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/clients/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import Appointment from "@/models/Appointment"
import Service from "@/models/Service"
import dbConnect from "@/lib/mongoose"
import { dayjs } from "@/lib/utils/date"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/Appointment", () => ({
  default: {
    find: vi.fn(),
  },
}))

vi.mock("@/models/Service", () => ({
  default: {
    find: vi.fn(),
  },
}))

describe("API /api/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  describe("GET", () => {
    it("returns 400 if userId is missing", async () => {
      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/clients")
      expect(res.status).toBe(400)
      expect(res.body.error).toBe("userId é obrigatório")
    })

    it("returns empty array if user has no appointments", async () => {
      vi.mocked(Appointment.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof Appointment.find>)

      vi.mocked(Service.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Service.find>)

      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/clients?userId=user-123")

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("aggregates appointments into summarized clients with correct recovery status", async () => {
      const now = dayjs().tz("America/Sao_Paulo")
      const tenDaysAgoISO = now.subtract(10, "day").toISOString()
      const twentyFiveDaysAgoISO = now.subtract(25, "day").toISOString()
      const fiftyDaysAgoISO = now.subtract(50, "day").toISOString()
      const futureISO = now.add(3, "day").toISOString()

      const mockServices = [
        { _id: "srv-corte", name: "Corte Tradicional" },
        { _id: "srv-barba", name: "Barba Terapia" },
      ]

      const mockAppointments = [
        // Cliente 1 (Carlos - 2 agendamentos, último há 25 dias -> status: warning)
        {
          _id: "app-1",
          userId: "user-123",
          serviceId: "srv-corte",
          clientName: "Carlos Silva",
          clientWhatsapp: "(11) 98888-1111",
          date: twentyFiveDaysAgoISO,
        },
        {
          _id: "app-2",
          userId: "user-123",
          serviceId: "srv-barba",
          clientName: "Carlos Silva",
          clientWhatsapp: "+5511988881111",
          date: now.subtract(55, "day").toISOString(),
        },
        // Cliente 2 (Marcos - 1 agendamento há 50 dias -> status: inactive)
        {
          _id: "app-3",
          userId: "user-123",
          serviceId: "srv-corte",
          clientName: "Marcos Souza",
          clientWhatsapp: "11977772222",
          date: fiftyDaysAgoISO,
        },
        // Cliente 3 (Bruno - 1 agendamento há 10 dias -> status: active)
        {
          _id: "app-4",
          userId: "user-123",
          serviceId: "srv-corte",
          clientName: "Bruno Gomes",
          clientWhatsapp: "11966663333",
          date: tenDaysAgoISO,
        },
        // Cliente 4 (Lucas - agendamento futuro -> status: upcoming)
        {
          _id: "app-5",
          userId: "user-123",
          serviceId: "srv-barba",
          clientName: "Lucas Lima",
          clientWhatsapp: "11955554444",
          date: futureISO,
        },
      ]

      vi.mocked(Appointment.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockAppointments),
        }),
      } as unknown as ReturnType<typeof Appointment.find>)

      vi.mocked(Service.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockServices),
      } as unknown as ReturnType<typeof Service.find>)

      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/clients?userId=user-123")

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(4)

      // Verificar Lucas (upcoming)
      const lucas = res.body.find((c: { name: string }) => c.name === "Lucas Lima")
      expect(lucas).toBeDefined()
      expect(lucas.status).toBe("upcoming")
      expect(lucas.lastServiceName).toBe("Barba Terapia")
      expect(lucas.totalAppointments).toBe(1)

      // Verificar Carlos (agrupado em 2 agendamentos, warning)
      const carlos = res.body.find((c: { name: string }) => c.name === "Carlos Silva")
      expect(carlos).toBeDefined()
      expect(carlos.totalAppointments).toBe(2)
      expect(carlos.status).toBe("warning")
      expect(carlos.lastServiceName).toBe("Corte Tradicional")

      // Verificar Marcos (inactive)
      const marcos = res.body.find((c: { name: string }) => c.name === "Marcos Souza")
      expect(marcos).toBeDefined()
      expect(marcos.status).toBe("inactive")

      // Verificar Bruno (active)
      const bruno = res.body.find((c: { name: string }) => c.name === "Bruno Gomes")
      expect(bruno).toBeDefined()
      expect(bruno.status).toBe("active")
    })
  })
})
