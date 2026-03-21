import request from "supertest"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/services/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import Service from "@/models/Service"
import dbConnect from "@/lib/mongoose"

// Mock mongoose and dbConnect
vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/Service", () => ({
  default: {
    find: vi.fn(),
    create: vi.fn(),
  },
}))

describe("API /api/services", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  describe("GET", () => {
    it("returns 400 if userId is missing", async () => {
      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/services")
      expect(res.status).toBe(400)
      expect(res.body.error).toBe("userId é obrigatório")
    })

    it("returns services for a given userId", async () => {
      const mockServices = [
        { id: "1", name: "Service 1", duration: 30, userId: "user-1" },
      ]
      vi.mocked(Service.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockServices),
      } as unknown as ReturnType<typeof Service.find>)

      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/services?userId=user-1")

      expect(res.status).toBe(200)
      expect(res.body).toEqual(mockServices)
      expect(Service.find).toHaveBeenCalledWith({ userId: "user-1" })
    })
  })

  describe("POST", () => {
    it("returns 400 if required fields are missing", async () => {
      const server = createRouteTestServer(POST)
      const res = await request(server).post("/api/services").send({})
      expect(res.status).toBe(400)
    })

    it("creates a new service", async () => {
      const newService = { name: "New Service", duration: 60, userId: "user-1" }
      const createdService = { ...newService, id: "2" }
      vi.mocked(Service.create).mockResolvedValue(createdService as unknown as ReturnType<typeof Service.create>)

      const server = createRouteTestServer(POST)
      const res = await request(server).post("/api/services").send(newService)

      expect(res.status).toBe(201)
      expect(res.body).toEqual(createdService)
      expect(Service.create).toHaveBeenCalledWith(expect.objectContaining(newService))
    })
  })
})
