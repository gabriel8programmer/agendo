import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST as registerPOST } from "@/app/api/auth/register/route"
import { POST as loginPOST } from "@/app/api/auth/login/route"
import { GET as meGET } from "@/app/api/auth/me/route"
import { POST as logoutPOST } from "@/app/api/auth/logout/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import User from "@/models/User"
import dbConnect from "@/lib/mongoose"
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
  toSafeSlug,
} from "@/lib/auth"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/User", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    collection: {
      updateOne: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  SESSION_COOKIE: "agendo_session",
  SESSION_HINT_COOKIE: "agendo_logged",
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  createSessionToken: vi.fn(),
  verifySessionToken: vi.fn(),
  toSafeSlug: vi.fn(),
}))

describe("API /api/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  describe("POST /api/auth/register", () => {
    it("returns 400 for missing fields", async () => {
      const server = createRouteTestServer(registerPOST)
      const res = await request(server).post("/api/auth/register").send({})
      expect(res.status).toBe(400)
      expect(res.body.error).toBe("Campos obrigatórios ausentes")
    })

    it("returns 409 when email already exists", async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce({ _id: "u1" } as never)
      const server = createRouteTestServer(registerPOST)
      const res = await request(server).post("/api/auth/register").send({
        name: "João",
        email: "joao@email.com",
        password: "123456",
      })
      expect(res.status).toBe(409)
      expect(res.body.error).toBe("Email já cadastrado")
    })

    it("creates user and returns 201", async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce(null as never).mockResolvedValueOnce(null as never)
      vi.mocked(toSafeSlug).mockReturnValue("joao")
      vi.mocked(hashPassword).mockResolvedValue("hash")
      vi.mocked(createSessionToken).mockReturnValue("token")
      vi.mocked(User.create).mockResolvedValue({
        _id: "user-1",
        name: "João",
        companyName: "Barbearia João",
        email: "joao@email.com",
        slug: "joao",
        slugLocked: false,
      } as never)

      const server = createRouteTestServer(registerPOST)
      const res = await request(server).post("/api/auth/register").send({
        name: "João",
        email: "joao@email.com",
        password: "123456",
      })

      expect(res.status).toBe(201)
      expect(res.body.user).toEqual(
        expect.objectContaining({
          id: "user-1",
          name: "João",
          companyName: "Barbearia João",
          email: "joao@email.com",
          slug: "joao",
          slugLocked: false,
        })
      )
    })
  })

  describe("POST /api/auth/login", () => {
    it("returns 400 for missing fields", async () => {
      const server = createRouteTestServer(loginPOST)
      const res = await request(server).post("/api/auth/login").send({})
      expect(res.status).toBe(400)
      expect(res.body.error).toBe("Email e senha são obrigatórios")
    })

    it("returns 401 for invalid credentials", async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce(null as never)
      const server = createRouteTestServer(loginPOST)
      const res = await request(server).post("/api/auth/login").send({
        email: "joao@email.com",
        password: "123456",
      })
      expect(res.status).toBe(401)
      expect(res.body.error).toBe("Credenciais inválidas")
    })

    it("returns 200 for valid credentials", async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce({
        _id: "user-1",
        name: "João",
        companyName: "Barbearia João",
        email: "joao@email.com",
        slug: "joao",
        slugLocked: false,
        passwordHash: "hash",
      } as never)
      vi.mocked(verifyPassword).mockResolvedValue(true)
      vi.mocked(createSessionToken).mockReturnValue("token")

      const server = createRouteTestServer(loginPOST)
      const res = await request(server).post("/api/auth/login").send({
        email: "joao@email.com",
        password: "123456",
      })

      expect(res.status).toBe(200)
      expect(res.body.user).toEqual(
        expect.objectContaining({
          id: "user-1",
          name: "João",
          companyName: "Barbearia João",
          email: "joao@email.com",
          slug: "joao",
          slugLocked: false,
        })
      )
    })

    it("returns 403 when user is Google-only", async () => {
      vi.mocked(User.findOne).mockResolvedValueOnce({
        _id: "user-1",
        email: "google@example.com",
        passwordHash: "",
      } as never)

      const server = createRouteTestServer(loginPOST)
      const res = await request(server).post("/api/auth/login").send({
        email: "google@example.com",
        password: "123456",
      })

      expect(res.status).toBe(403)
      expect(res.body.error).toBe("Usuário já autenticado com Google. Faça login com Google.")
    })
  })

  describe("GET /api/auth/me", () => {
    it("returns 401 when no cookie is provided", async () => {
      const server = createRouteTestServer(meGET)
      const res = await request(server).get("/api/auth/me")
      expect(res.status).toBe(401)
    })

    it("returns 401 when session token is invalid", async () => {
      vi.mocked(verifySessionToken).mockReturnValue(null)
      const server = createRouteTestServer(meGET)
      const res = await request(server).get("/api/auth/me").set("Cookie", "agendo_session=abc")
      expect(res.status).toBe(401)
      expect(res.body.error).toBe("Sessão inválida")
    })

    it("returns 200 when session token is valid", async () => {
      vi.mocked(verifySessionToken).mockReturnValue({
        userId: "user-1",
        email: "joao@email.com",
        name: "João",
        exp: 9999999999,
      })
      vi.mocked(User.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "user-1",
          name: "João",
          companyName: "Barbearia João",
          email: "joao@email.com",
          slug: "joao",
          slugLocked: true,
        }),
      } as never)

      const server = createRouteTestServer(meGET)
      const res = await request(server).get("/api/auth/me").set("Cookie", "agendo_session=abc")

      expect(res.status).toBe(200)
      expect(res.body.user).toEqual(
        expect.objectContaining({
          id: "user-1",
          name: "João",
          companyName: "Barbearia João",
          email: "joao@email.com",
          slug: "joao",
          slugLocked: true,
        })
      )
    })
  })

  describe("POST /api/auth/logout", () => {
    it("returns ok=true", async () => {
      const server = createRouteTestServer(logoutPOST)
      const res = await request(server).post("/api/auth/logout")
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ ok: true })
    })
  })
})
