import { describe, it, expect } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"

describe("Health Check API Endpoints", () => {
  it("GET /health should return 200 with service info", async () => {
    const response = await request(app).get("/health")

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.status).toBe("ok")
    expect(response.body.data.service).toBe("saheli-backend")
    expect(response.body.data.version).toBe("1.0.0")
    expect(response.body.data.modes.emergencyDelivery).toBe("mock")
  })

  it("GET /api/v1/health should return 200 and match structure", async () => {
    const response = await request(app).get("/api/v1/health")

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.status).toBe("ok")
    expect(typeof response.body.data.uptimeSeconds).toBe("number")
    expect(typeof response.body.data.timestamp).toBe("string")
  })

  it("GET /unknown-endpoint should return 404 NOT_FOUND", async () => {
    const response = await request(app).get("/unknown-endpoint")

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe("NOT_FOUND")
  })
})
