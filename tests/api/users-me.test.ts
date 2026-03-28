import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PATCH } from "@/app/api/users/me/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"
import { verifySessionToken, toSafeSlug } from "@/lib/auth"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/User", () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
    collection: {
      updateOne: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  SESSION_COOKIE: "agendo_session",
  verifySessionToken: vi.fn(),
  toSafeSlug: vi.fn(),
}))

describe("PATCH /api/users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  it("returns 401 when user is not authenticated", async () => {
    const server = createRouteTestServer(PATCH)
    const res = await request(server).patch("/api/users/me").send({ companyName: "Nova Empresa" })
    expect(res.status).toBe(401)
  })

  it("returns 403 when trying to change slug after lock", async () => {
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
        slug: "barbearia-joao",
        slugLocked: true,
      }),
    } as never)
    vi.mocked(toSafeSlug).mockReturnValue("novo-slug")

    const server = createRouteTestServer(PATCH)
    const res = await request(server)
      .patch("/api/users/me")
      .set("Cookie", "agendo_session=valid")
      .send({ slug: "novo slug" })

    expect(res.status).toBe(403)
    expect(res.body.error).toBe("Slug já foi definido e não pode mais ser alterado")
  })

  it("returns 409 when requested slug is already used by another user", async () => {
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
        slug: "barbearia-joao",
        slugLocked: false,
      }),
    } as never)
    vi.mocked(toSafeSlug).mockReturnValue("slug-em-uso")
    vi.mocked(User.findOne).mockResolvedValue({ _id: "user-2" } as never)

    const server = createRouteTestServer(PATCH)
    const res = await request(server)
      .patch("/api/users/me")
      .set("Cookie", "agendo_session=valid")
      .send({ slug: "slug em uso" })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe("Slug já está em uso")
  })

  it("updates companyName and slug on first change", async () => {
    const userDoc = {
      _id: "user-1",
      name: "João",
      companyName: "Barbearia João",
      email: "joao@email.com",
      slug: "barbearia-joao",
      slugLocked: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    }

    vi.mocked(verifySessionToken).mockReturnValue({
      userId: "user-1",
      email: "joao@email.com",
      name: "João",
      exp: 9999999999,
    })
    vi.mocked(User.findById)
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(userDoc),
      } as never)
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({
          ...userDoc,
          companyName: "Minha Nova Empresa",
          slug: "minha-nova-empresa",
          slugLocked: true,
        }),
      } as never)
    vi.mocked(toSafeSlug).mockReturnValue("minha-nova-empresa")
    vi.mocked(User.findOne).mockResolvedValue(null as never)

    const server = createRouteTestServer(PATCH)
    const res = await request(server)
      .patch("/api/users/me")
      .set("Cookie", "agendo_session=valid")
      .send({
        companyName: "Minha Nova Empresa",
        slug: "Minha Nova Empresa",
      })

    expect(res.status).toBe(200)
    expect(User.collection.updateOne).toHaveBeenCalled()
    expect(res.body.user).toEqual(
      expect.objectContaining({
        id: "user-1",
        companyName: "Minha Nova Empresa",
        slug: "minha-nova-empresa",
        slugLocked: true,
      })
    )
  })
})
