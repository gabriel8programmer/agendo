import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "@/app/api/webhooks/stripe/route"
import { createRouteTestServer } from "@/tests/helpers/createRouteTestServer"
import dbConnect from "@/lib/mongoose"
import User from "@/models/User"

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn(),
}))

vi.mock("@/models/User", () => ({
  default: {
    collection: {
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    },
  },
}))

describe("API /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbConnect).mockResolvedValue({} as unknown as typeof import("mongoose"))
  })

  it("returns 400 when payload is invalid JSON without signature", async () => {
    const server = createRouteTestServer(POST)
    const res = await request(server)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send("invalid-json{")

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Payload do webhook inválido")
  })

  it("handles checkout.session.completed in payment mode (Pix or single cycle)", async () => {
    const server = createRouteTestServer(POST)
    const event = {
      id: "evt_test_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          mode: "payment",
          customer: "cus_123",
          client_reference_id: "user-1",
          metadata: {
            userId: "user-1",
            plan: "monthly",
          },
        },
      },
    }

    const res = await request(server)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send(event)

    expect(res.status).toBe(200)
    expect(res.body.received).toBe(true)
    expect(User.collection.updateOne).toHaveBeenCalledWith(
      { _id: "user-1" },
      expect.objectContaining({
        $set: expect.objectContaining({
          subscriptionPlan: "monthly",
          subscriptionStatus: "active",
          stripeCustomerId: "cus_123",
          subscriptionExpiresAt: expect.any(Date),
        }),
      })
    )
  })

  it("handles checkout.session.completed in subscription mode for annual plan", async () => {
    const server = createRouteTestServer(POST)
    const event = {
      id: "evt_test_2",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_2",
          mode: "subscription",
          customer: "cus_456",
          subscription: "sub_annual_999",
          client_reference_id: "user-2",
          metadata: {
            userId: "user-2",
            plan: "annual",
          },
        },
      },
    }

    const res = await request(server)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send(event)

    expect(res.status).toBe(200)
    expect(res.body.received).toBe(true)
    expect(User.collection.updateOne).toHaveBeenCalledWith(
      { _id: "user-2" },
      expect.objectContaining({
        $set: expect.objectContaining({
          subscriptionPlan: "annual",
          subscriptionStatus: "active",
          stripeCustomerId: "cus_456",
          stripeSubscriptionId: "sub_annual_999",
        }),
      })
    )
  })

  it("handles customer.subscription.deleted by cancelling plan and returning 200", async () => {
    const server = createRouteTestServer(POST)
    const event = {
      id: "evt_test_3",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_annual_999",
          customer: "cus_456",
        },
      },
    }

    const res = await request(server)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send(event)

    expect(res.status).toBe(200)
    expect(res.body.received).toBe(true)
    expect(User.collection.updateOne).toHaveBeenCalledWith(
      {
        $or: [{ stripeSubscriptionId: "sub_annual_999" }, { stripeCustomerId: "cus_456" }],
      },
      expect.objectContaining({
        $set: {
          subscriptionStatus: "canceled",
          subscriptionPlan: "free",
        },
      })
    )
  })

  it("handles invoice.payment_succeeded by keeping status active", async () => {
    const server = createRouteTestServer(POST)
    const event = {
      id: "evt_test_4",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_123",
          customer: "cus_456",
        },
      },
    }

    const res = await request(server)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send(event)

    expect(res.status).toBe(200)
    expect(res.body.received).toBe(true)
    expect(User.collection.updateOne).toHaveBeenCalledWith(
      { stripeCustomerId: "cus_456" },
      expect.objectContaining({
        $set: {
          subscriptionStatus: "active",
        },
      })
    )
  })
})
