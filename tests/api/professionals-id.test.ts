import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PATCH } from "@/app/api/professionals/[id]/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import dbConnect from "@/lib/mongoose"
import Professional from "@/models/Professional"
import Service from "@/models/Service"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/Professional", () => ({
  default: {
    findOne: vi.fn(),
  },
}))

vi.mock("@/models/Service", () => ({
  default: {
    countDocuments: vi.fn(),
  },
}))

describe("API /api/professionals/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  it("returns 400 when userId is missing", async () => {
    const server = createRouteTestServer((req) =>
      PATCH(req, { params: Promise.resolve({ id: "680d3d31bfc3a8bdf31e0c19" }) })
    )

    const res = await request(server).patch("/api/professionals/680d3d31bfc3a8bdf31e0c19").send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("userId é obrigatório")
  })

  it("returns 404 when professional is not found", async () => {
    vi.mocked(Professional.findOne).mockResolvedValue(null as never)

    const server = createRouteTestServer((req) =>
      PATCH(req, { params: Promise.resolve({ id: "680d3d31bfc3a8bdf31e0c19" }) })
    )

    const res = await request(server).patch("/api/professionals/680d3d31bfc3a8bdf31e0c19").send({
      userId: "user-1",
      name: "João",
    })

    expect(res.status).toBe(404)
    expect(res.body.error).toBe("Profissional não encontrado")
  })

  it("updates professional", async () => {
    vi.mocked(Service.countDocuments).mockResolvedValue(1 as never)
    const save = vi.fn().mockResolvedValue(undefined)
    const professionalDoc = {
      name: "Antigo",
      userId: "user-1",
      whatsapp: "",
      isActive: true,
      serviceIds: [],
      availability: {
        slotDuration: 30,
        startTime: "09:00",
        endTime: "18:00",
        workDays: [1, 2, 3],
        reservedIntervals: [],
      },
      save,
    }
    vi.mocked(Professional.findOne).mockResolvedValue(professionalDoc as never)

    const server = createRouteTestServer((req) =>
      PATCH(req, { params: Promise.resolve({ id: "680d3d31bfc3a8bdf31e0c19" }) })
    )

    const res = await request(server).patch("/api/professionals/680d3d31bfc3a8bdf31e0c19").send({
      userId: "user-1",
      name: "João",
      serviceIds: ["service-1"],
      isActive: false,
    })

    expect(res.status).toBe(200)
    expect(save).toHaveBeenCalledTimes(1)
    expect(professionalDoc.name).toBe("João")
    expect(professionalDoc.isActive).toBe(false)
    expect(professionalDoc.serviceIds).toEqual(["service-1"])
  })
})
