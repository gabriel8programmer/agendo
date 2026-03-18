import request from "supertest"
import { describe, expect, it } from "vitest"

import { GET } from "@/app/api/health/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"

describe("GET /api/health", () => {
  it("returns 200 with ok=true", async () => {
    const server = createRouteTestServer(GET)

    const res = await request(server).get("/api/health")

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
