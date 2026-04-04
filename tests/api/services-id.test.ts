import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PATCH } from "@/app/api/services/[id]/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import Service from "@/models/Service"
import dbConnect from "@/lib/mongoose"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/Service", () => ({
  default: {
    findByIdAndUpdate: vi.fn(),
  },
}))

describe("API /api/services/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  it("returns 400 for invalid duration", async () => {
    const server = createRouteTestServer((req) =>
      PATCH(req, { params: Promise.resolve({ id: "service-1" }) })
    )

    const res = await request(server).patch("/api/services/service-1").send({
      duration: 0,
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Duração inválida")
  })

  it("returns 404 when service is not found", async () => {
    vi.mocked(Service.findByIdAndUpdate).mockResolvedValue(null as never)

    const server = createRouteTestServer((req) =>
      PATCH(req, { params: Promise.resolve({ id: "service-1" }) })
    )
    const res = await request(server).patch("/api/services/service-1").send({
      name: "Corte social",
      duration: 45,
      price: 50,
    })

    expect(res.status).toBe(404)
    expect(res.body.error).toBe("Serviço não encontrado")
  })

  it("updates a service", async () => {
    vi.mocked(Service.findByIdAndUpdate).mockResolvedValue({
      id: "service-1",
      name: "Corte premium",
      duration: 60,
      price: 70,
    } as never)

    const server = createRouteTestServer((req) =>
      PATCH(req, { params: Promise.resolve({ id: "service-1" }) })
    )

    const payload = {
      name: "Corte premium",
      duration: 60,
      price: 70,
    }
    const res = await request(server).patch("/api/services/service-1").send(payload)

    expect(res.status).toBe(200)
    expect(Service.findByIdAndUpdate).toHaveBeenCalledWith(
      "service-1",
      payload,
      expect.objectContaining({ new: true, runValidators: true })
    )
  })
})

