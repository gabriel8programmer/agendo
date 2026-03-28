import request from "supertest"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"

import { GET as googleStartGET } from "@/app/api/auth/google/route"
import { GET as googleCallbackGET } from "@/app/api/auth/google/callback/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { createSessionToken } from "@/lib/auth"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/User", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    collection: {
      updateOne: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  SESSION_COOKIE: "agendo_session",
  SESSION_HINT_COOKIE: "agendo_logged",
  createSessionToken: vi.fn(),
  toSafeSlug: vi.fn((value: string) => value.toLowerCase().replace(/\s+/g, "-")),
}))

describe("API /api/auth/google", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.APP_URL = "http://localhost:3000"
    process.env.GOOGLE_CLIENT_ID = "google-client-id"
    process.env.GOOGLE_CLIENT_SECRET = "google-client-secret"
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it("redirects to google auth URL and sets oauth state cookie", async () => {
    const server = createRouteTestServer(googleStartGET)
    const res = await request(server).get("/api/auth/google")

    expect(res.status).toBe(307)
    expect(res.headers.location).toContain("https://accounts.google.com/o/oauth2/v2/auth")
    expect(res.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("agendo_oauth_state=")])
    )
  })

  it("returns 500 if GOOGLE_CLIENT_ID is missing", async () => {
    delete process.env.GOOGLE_CLIENT_ID

    const server = createRouteTestServer(googleStartGET)
    const res = await request(server).get("/api/auth/google")

    expect(res.status).toBe(500)
    expect(res.body.error).toBe("GOOGLE_CLIENT_ID não configurado")
  })

  it("rejects callback when state does not match cookie", async () => {
    const server = createRouteTestServer(googleCallbackGET)
    const res = await request(server)
      .get("/api/auth/google/callback?code=abc&state=state-1")
      .set("Cookie", "agendo_oauth_state=state-2")

    expect(res.status).toBe(307)
    expect(res.headers.location).toContain("/login?error=google_state_invalid")
  })

  it("logs in existing user and redirects to dashboard", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "token-123" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ email: "google@example.com", name: "Google User" }),
        } as Response)
    )

    vi.mocked(User.findOne).mockResolvedValue({
      _id: "user-1",
      name: "Google User",
      companyName: "Google User",
      email: "google@example.com",
      slug: "google-user",
      slugLocked: false,
    } as never)
    vi.mocked(createSessionToken).mockReturnValue("session-token")

    const server = createRouteTestServer(googleCallbackGET)
    const res = await request(server)
      .get("/api/auth/google/callback?code=abc&state=state-1")
      .set("Cookie", "agendo_oauth_state=state-1")

    expect(res.status).toBe(307)
    expect(res.headers.location).toBe("http://localhost:3000/dashboard")
    expect(createSessionToken).toHaveBeenCalledWith({
      userId: "user-1",
      email: "google@example.com",
      name: "Google User",
    })
  })
})
