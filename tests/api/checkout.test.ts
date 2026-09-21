import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GET, POST } from "@/app/api/checkout/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { verifySessionToken } from "@/lib/auth"
import { stripe } from "@/lib/stripe"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/User", () => ({
  default: {
    findById: vi.fn(),
    collection: {
      updateOne: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  SESSION_COOKIE: "agendo_session",
  verifySessionToken: vi.fn(),
}))

vi.mock("@/lib/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe")>()
  return {
    ...actual,
    stripe: {
      customers: {
        create: vi.fn().mockResolvedValue({ id: "cus_mock_123" }),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "cs_test_mock_session",
            url: "https://checkout.stripe.com/pay/cs_test_mock_session",
          }),
        },
      },
    },
  }
})

describe("API /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
    vi.mocked(stripe.customers.create).mockResolvedValue({ id: "cus_mock_123" } as never)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      id: "cs_test_mock_session",
      url: "https://checkout.stripe.com/pay/cs_test_mock_session",
    } as never)
  })

  describe("GET", () => {
    it("returns available plans configuration with 200", async () => {
      const server = createRouteTestServer(GET)
      const res = await request(server).get("/api/checkout")

      expect(res.status).toBe(200)
      expect(res.body.plans).toBeInstanceOf(Array)
      expect(res.body.plans.length).toBe(2)

      const monthly = res.body.plans.find((p: { id: string }) => p.id === "monthly")
      const annual = res.body.plans.find((p: { id: string }) => p.id === "annual")

      expect(monthly).toBeDefined()
      expect(monthly.price).toBe(24.9)
      expect(monthly.interval).toBe("month")

      expect(annual).toBeDefined()
      expect(annual.price).toBe(268.92)
      expect(annual.discountPercentage).toBe(10)
      expect(annual.interval).toBe("year")
    })
  })

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      const server = createRouteTestServer(POST)
      const res = await request(server).post("/api/checkout").send({ plan: "monthly" })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe("Não autenticado")
    })

    it("returns 401 when session token is invalid", async () => {
      vi.mocked(verifySessionToken).mockReturnValue(null)

      const server = createRouteTestServer(POST)
      const res = await request(server)
        .post("/api/checkout")
        .set("Cookie", "agendo_session=invalid")
        .send({ plan: "monthly" })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe("Sessão inválida")
    })

    it("returns 400 when plan is missing or invalid", async () => {
      vi.mocked(verifySessionToken).mockReturnValue({
        userId: "user-1",
        email: "joao@email.com",
        name: "João",
        exp: 9999999999,
      })

      const server = createRouteTestServer(POST)
      const res = await request(server)
        .post("/api/checkout")
        .set("Cookie", "agendo_session=valid")
        .send({ plan: "plano-inexistente" })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe("Plano inválido ou não informado")
    })

    it("returns 404 when user does not exist in database", async () => {
      vi.mocked(verifySessionToken).mockReturnValue({
        userId: "user-1",
        email: "joao@email.com",
        name: "João",
        exp: 9999999999,
      })
      vi.mocked(User.findById).mockResolvedValue(null)

      const server = createRouteTestServer(POST)
      const res = await request(server)
        .post("/api/checkout")
        .set("Cookie", "agendo_session=valid")
        .send({ plan: "monthly" })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe("Usuário não encontrado")
    })

    it("creates a checkout session for monthly plan and returns session url", async () => {
      vi.mocked(verifySessionToken).mockReturnValue({
        userId: "user-1",
        email: "joao@email.com",
        name: "João",
        exp: 9999999999,
      })

      const mockUser = {
        _id: "user-1",
        email: "joao@email.com",
        name: "João",
        stripeCustomerId: "cus_existing_123",
      }
      vi.mocked(User.findById).mockResolvedValue(mockUser as never)

      const server = createRouteTestServer(POST)
      const res = await request(server)
        .post("/api/checkout")
        .set("Cookie", "agendo_session=valid")
        .send({ plan: "monthly", mode: "payment" })

      expect(res.status).toBe(200)
      expect(res.body.url).toBe("https://checkout.stripe.com/pay/cs_test_mock_session")
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "payment",
          customer: "cus_existing_123",
          client_reference_id: "user-1",
          payment_method_types: ["card", "pix"],
          metadata: expect.objectContaining({
            plan: "monthly",
            userId: "user-1",
          }),
        })
      )
    })

    it("creates a checkout session for annual plan with 10% discount in subscription mode", async () => {
      vi.mocked(verifySessionToken).mockReturnValue({
        userId: "user-2",
        email: "maria@email.com",
        name: "Maria",
        exp: 9999999999,
      })

      const mockUser = {
        _id: "user-2",
        email: "maria@email.com",
        name: "Maria",
      }
      vi.mocked(User.findById).mockResolvedValue(mockUser as never)

      const server = createRouteTestServer(POST)
      const res = await request(server)
        .post("/api/checkout")
        .set("Cookie", "agendo_session=valid")
        .send({ plan: "annual", mode: "subscription" })

      expect(res.status).toBe(200)
      expect(res.body.url).toBe("https://checkout.stripe.com/pay/cs_test_mock_session")
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: "maria@email.com",
        name: "Maria",
        metadata: { userId: "user-2" },
      })
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
          client_reference_id: "user-2",
          payment_method_types: ["card"],
          metadata: expect.objectContaining({
            plan: "annual",
            userId: "user-2",
          }),
        })
      )
    })
  })
})
