import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DELETE } from "@/app/api/appointments/[id]/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import dbConnect from "@/lib/mongoose"
import Appointment from "@/models/Appointment"
import { verifySessionToken } from "@/lib/auth"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/Appointment", () => ({
  default: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}))

vi.mock("@/lib/auth", () => ({
  SESSION_COOKIE: "agendo_session",
  verifySessionToken: vi.fn(),
}))

vi.mock("@/lib/telemetry/server", () => ({
  trackServerEvent: vi.fn(),
}))

describe("API /api/appointments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  it("returns 400 for invalid appointment id", async () => {
    const server = createRouteTestServer((req) =>
      DELETE(req, { params: Promise.resolve({ id: "invalid-id" }) })
    )

    const res = await request(server).delete("/api/appointments/invalid-id")
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("ID de agendamento inválido")
  })

  it("returns 401 when user is not authenticated and no userId is provided", async () => {
    vi.mocked(verifySessionToken).mockReturnValue(null)

    const validId = "680d3d31bfc3a8bdf31e0c19"
    const server = createRouteTestServer((req) =>
      DELETE(req, { params: Promise.resolve({ id: validId }) })
    )

    const res = await request(server).delete(`/api/appointments/${validId}`)
    expect(res.status).toBe(401)
    expect(res.body.error).toBe("Não autorizado")
  })

  it("returns 404 when appointment is not found", async () => {
    vi.mocked(verifySessionToken).mockReturnValue({
      userId: "user-1",
      email: "test@email.com",
      name: "Test",
      exp: 9999999999,
    })
    vi.mocked(Appointment.findOne).mockResolvedValue(null as never)

    const validId = "680d3d31bfc3a8bdf31e0c19"
    const server = createRouteTestServer((req) =>
      DELETE(req, { params: Promise.resolve({ id: validId }) })
    )

    const res = await request(server)
      .delete(`/api/appointments/${validId}`)
      .set("Cookie", "agendo_session=valid")

    expect(res.status).toBe(404)
    expect(res.body.error).toBe("Agendamento não encontrado")
  })

  it("deletes appointment and returns 200 when authenticated", async () => {
    vi.mocked(verifySessionToken).mockReturnValue({
      userId: "user-1",
      email: "test@email.com",
      name: "Test",
      exp: 9999999999,
    })
    vi.mocked(Appointment.findOne).mockResolvedValue({
      _id: "680d3d31bfc3a8bdf31e0c19",
      userId: "user-1",
    } as never)
    vi.mocked(Appointment.deleteOne).mockResolvedValue({ deletedCount: 1 } as never)

    const validId = "680d3d31bfc3a8bdf31e0c19"
    const server = createRouteTestServer((req) =>
      DELETE(req, { params: Promise.resolve({ id: validId }) })
    )

    const res = await request(server)
      .delete(`/api/appointments/${validId}`)
      .set("Cookie", "agendo_session=valid")

    expect(res.status).toBe(200)
    expect(Appointment.deleteOne).toHaveBeenCalledWith({
      _id: validId,
      userId: "user-1",
    })
    expect(res.body.success).toBe(true)
  })
})
