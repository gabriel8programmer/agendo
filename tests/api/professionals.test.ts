import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET, POST } from "@/app/api/professionals/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import dbConnect from "@/lib/mongoose"
import Professional from "@/models/Professional"
import Service from "@/models/Service"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/Professional", () => ({
  default: {
    find: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock("@/models/Service", () => ({
  default: {
    countDocuments: vi.fn(),
  },
}))

describe("API /api/professionals", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  describe("GET", () => {
    it("returns 400 when userId is missing", async () => {
      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/professionals")

      expect(res.status).toBe(400)
      expect(res.body.error).toBe("userId é obrigatório")
    })

    it("returns professionals for the given user", async () => {
      vi.mocked(Professional.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: "680d3d31bfc3a8bdf31e0c19",
              userId: "user-1",
              name: "João",
              isActive: true,
              serviceIds: ["service-1"],
              availability: {
                slotDuration: 30,
                startTime: "09:00",
                endTime: "18:00",
                workDays: [1, 2, 3, 4, 5],
                reservedIntervals: [],
              },
              createdAt: "2026-04-26T00:00:00.000Z",
            },
          ]),
        }),
      } as never)

      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/professionals?userId=user-1")

      expect(res.status).toBe(200)
      expect(res.body[0]).toMatchObject({
        id: "680d3d31bfc3a8bdf31e0c19",
        userId: "user-1",
        name: "João",
      })
      expect(Professional.find).toHaveBeenCalledWith({ userId: "user-1" })
    })
  })

  describe("POST", () => {
    it("returns 400 when required fields are missing", async () => {
      const server = createRouteTestServer(POST)
      const res = await request(server).post("/api/professionals").send({})

      expect(res.status).toBe(400)
      expect(res.body.error).toBe("Campos obrigatórios ausentes")
    })

    it("returns 400 when service does not belong to tenant", async () => {
      vi.mocked(Service.countDocuments).mockResolvedValue(0 as never)

      const server = createRouteTestServer(POST)
      const res = await request(server).post("/api/professionals").send({
        userId: "user-1",
        name: "João",
        serviceIds: ["service-1"],
      })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe("Um ou mais serviços não pertencem à empresa")
    })

    it("creates a professional", async () => {
      vi.mocked(Service.countDocuments).mockResolvedValue(1 as never)
      vi.mocked(Professional.create).mockResolvedValue({
        id: "professional-1",
        userId: "user-1",
        name: "João",
      } as never)

      const server = createRouteTestServer(POST)
      const res = await request(server).post("/api/professionals").send({
        userId: "user-1",
        name: "João",
        serviceIds: ["service-1"],
      })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        id: "professional-1",
        userId: "user-1",
        name: "João",
      })
      expect(Service.countDocuments).toHaveBeenCalledWith({
        userId: "user-1",
        _id: { $in: ["service-1"] },
      })
      expect(Professional.create).toHaveBeenCalled()
    })
  })
})
