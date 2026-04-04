import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST as passwordResetRequestPOST } from "@/app/api/auth/password-reset/request/route"
import { POST as passwordResetConfirmPOST } from "@/app/api/auth/password-reset/confirm/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import PasswordResetRequest from "@/models/PasswordResetRequest"
import { sendEmail } from "@/lib/email/mailer"
import { hashPassword } from "@/lib/auth"
import { clearRateLimitStore } from "@/lib/security/rateLimit"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/User", () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    collection: {
      updateOne: vi.fn(),
    },
  },
}))

vi.mock("@/models/PasswordResetRequest", () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
  },
}))

vi.mock("@/lib/email/templates/verifyEmailTemplate", () => ({
  buildVerifyEmailTemplate: vi.fn(() => ({
    subject: "Verifique seu email",
    html: "<p>ok</p>",
    text: "ok",
  })),
}))

vi.mock("@/lib/email/mailer", () => ({
  sendEmail: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  generateOpaqueToken: vi.fn((size: number) => `token-${size}`),
  hashOpaqueToken: vi.fn((token: string) => `hash-${token}`),
  hashPassword: vi.fn(),
}))

describe("API /api/auth/password-reset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRateLimitStore()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  it("blocks reset request for Google-only user", async () => {
    vi.mocked(User.findOne).mockResolvedValue({
      _id: "user-google",
      email: "google@example.com",
      passwordHash: "",
    } as never)

    const server = createRouteTestServer(passwordResetRequestPOST)
    const res = await request(server).post("/api/auth/password-reset/request").send({
      email: "google@example.com",
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Usuário já autenticado com Google. Faça login com Google.")
    expect(PasswordResetRequest.create).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("blocks password reset confirmation for Google-only user", async () => {
    vi.mocked(PasswordResetRequest.findOne).mockResolvedValue({
      requestId: "request-1",
      userId: "user-google",
      verifiedAt: new Date(),
      usedAt: undefined,
      expiresAt: new Date(Date.now() + 1000 * 60),
      save: vi.fn(),
    } as never)

    vi.mocked(User.findById).mockResolvedValue({
      _id: "user-google",
      passwordHash: "",
    } as never)

    const server = createRouteTestServer(passwordResetConfirmPOST)
    const res = await request(server).post("/api/auth/password-reset/confirm").send({
      requestId: "request-1",
      password: "123456",
      confirmPassword: "123456",
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Usuário já autenticado com Google. Faça login com Google.")
    expect(hashPassword).not.toHaveBeenCalled()
    expect(User.collection.updateOne).not.toHaveBeenCalled()
  })

  it("returns 429 after too many reset requests", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null as never)

    const server = createRouteTestServer(passwordResetRequestPOST)
    for (let i = 0; i < 5; i += 1) {
      const res = await request(server).post("/api/auth/password-reset/request").send({
        email: "joao@email.com",
      })
      expect(res.status).toBe(200)
    }

    const blocked = await request(server).post("/api/auth/password-reset/request").send({
      email: "joao@email.com",
    })

    expect(blocked.status).toBe(429)
    expect(blocked.body.error).toContain("Muitas tentativas para recuperação de senha")
    expect(blocked.headers["retry-after"]).toBeDefined()
  })
})
