import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "@/app/api/checkout/portal/route"
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
      billingPortal: {
        sessions: {
          create: vi.fn(),
        },
      },
    },
  }
})

describe("API /api/checkout/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
    vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue({
      url: "https://billing.stripe.com/p/session_mock_123",
    } as never)
  })

  it("returns 401 when not authenticated", async () => {
    const server = createRouteTestServer(POST)
    const res = await request(server).post("/api/checkout/portal")

    expect(res.status).toBe(401)
    expect(res.body.error).toBe("Não autenticado")
  })

  it("returns 401 when token is invalid", async () => {
    vi.mocked(verifySessionToken).mockReturnValue(null)

    const server = createRouteTestServer(POST)
    const res = await request(server)
      .post("/api/checkout/portal")
      .set("Cookie", "agendo_session=invalid")

    expect(res.status).toBe(401)
    expect(res.body.error).toBe("Sessão inválida")
  })

  it("returns 404 when user is not found", async () => {
    vi.mocked(verifySessionToken).mockReturnValue({
      userId: "user-1",
      email: "user@test.com",
      name: "User",
      exp: 9999999999,
    })
    vi.mocked(User.findById).mockResolvedValue(null)

    const server = createRouteTestServer(POST)
    const res = await request(server)
      .post("/api/checkout/portal")
      .set("Cookie", "agendo_session=valid")

    expect(res.status).toBe(404)
    expect(res.body.error).toBe("Usuário não encontrado")
  })

  it("returns 400 when user does not have a stripeCustomerId", async () => {
    vi.mocked(verifySessionToken).mockReturnValue({
      userId: "user-1",
      email: "user@test.com",
      name: "User",
      exp: 9999999999,
    })
    vi.mocked(User.findById).mockResolvedValue({
      _id: "user-1",
      stripeCustomerId: undefined,
    } as never)

    const server = createRouteTestServer(POST)
    const res = await request(server)
      .post("/api/checkout/portal")
      .set("Cookie", "agendo_session=valid")

    expect(res.status).toBe(400)
    expect(res.body.error).toContain("Nenhuma conta de faturamento Stripe vinculada")
  })

  it("returns 200 and portal URL when user has stripeCustomerId", async () => {
    vi.mocked(verifySessionToken).mockReturnValue({
      userId: "user-1",
      email: "user@test.com",
      name: "User",
      exp: 9999999999,
    })
    vi.mocked(User.findById).mockResolvedValue({
      _id: "user-1",
      stripeCustomerId: "cus_customer_123",
    } as never)

    const server = createRouteTestServer(POST)
    const res = await request(server)
      .post("/api/checkout/portal")
      .set("Cookie", "agendo_session=valid")

    expect(res.status).toBe(200)
    expect(res.body.url).toBe("https://billing.stripe.com/p/session_mock_123")
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_customer_123",
      })
    )
  })
})
