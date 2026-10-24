import { describe, it, expect, beforeAll, afterAll } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"

describe("Phase 5: AI Safety Assistant, Disaster Alerts & Shelters", () => {
  beforeAll(async () => {
    // Ensure seed data for disaster alert and shelters exists
    const alert = await prisma.disasterAlert.findFirst({ where: { title: "Heavy rain alert" } })
    if (!alert) {
      await prisma.disasterAlert.create({
        data: {
          title: "Heavy rain alert",
          severity: "warning",
          category: "Weather",
          source: "IMD (Simulated sample feed)",
          active: true,
          area: "East Khasi Hills",
          details: "IMD orange alert for East Khasi Hills.",
          isSample: true,
        },
      })
    }

    const shelter = await prisma.shelter.findFirst({ where: { name: "One Stop Centre (Sakhi)" } })
    if (!shelter) {
      await prisma.shelter.create({
        data: {
          name: "One Stop Centre (Sakhi)",
          type: "Government support centre",
          status: "Confirmed",
          distanceKm: 1.8,
          area: "East Khasi Hills",
          womenOnly: true,
          accessible: true,
          open24: true,
          facilities: JSON.stringify(["Counselling", "Legal aid", "Temporary stay"]),
          phone: "181",
          isSample: true,
        },
      })
    }
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe("1. AI Safety Assistant (POST /api/v1/assistant)", () => {
    it("should provide emergency safety guidance with 112 recommendation when feeling unsafe", async () => {
      const res = await request(app)
        .post("/api/v1/assistant")
        .send({ prompt: "I feel unsafe, someone is following me" })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.text).toContain("112")
      expect(res.body.data.text).toContain("well-lit")
      expect(res.body.data.provider).toBe("heuristic_mock")
      expect(res.body.data.isAiGenerated).toBe(false)
      expect(res.body.data.disclaimer).toContain("cannot replace emergency services")
    })

    it("should provide harassment guidance mentioning 1930 and cybercrime portal", async () => {
      const res = await request(app)
        .post("/api/v1/assistant")
        .send({ prompt: "Help with online harassment and blackmail" })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.text).toContain("1930")
      expect(res.body.data.text).toContain("cybercrime.gov.in")
      expect(res.body.data.sources.some((s: string) => s.includes("1930"))).toBe(true)
    })

    it("should provide contextual guidance during a disaster alert", async () => {
      const res = await request(app)
        .post("/api/v1/assistant")
        .send({
          prompt: "What should I do during the heavy rain alert?",
          context: { alert: true },
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.text).toContain("underpass")
      expect(res.body.data.sources.some((s: string) => s.includes("Weather Alert"))).toBe(true)
    })

    it("should reject empty or invalid assistant queries with 400 validation error", async () => {
      const res = await request(app)
        .post("/api/v1/assistant")
        .send({ prompt: " " })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("should never falsely claim live real-time surveillance", async () => {
      const res = await request(app)
        .post("/api/v1/assistant")
        .send({ prompt: "Are there police right in front of me now?" })

      expect(res.status).toBe(200)
      expect(res.body.data.disclaimer).toContain("not real-time surveillance")
    })
  })

  describe("2. Disaster Alerts API (GET /api/v1/alerts)", () => {
    it("should return disaster alerts clearly labeled with isSample: true", async () => {
      const res = await request(app).get("/api/v1/alerts")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.count).toBeGreaterThanOrEqual(1)
      expect(res.body.data.hasLiveFeeds).toBe(false)

      const alert = res.body.data.alerts[0]
      expect(alert.title).toBe("Heavy rain alert")
      expect(alert.isSample).toBe(true)
      expect(alert.disclaimer).toContain("Simulated sample advisory")
    })

    it("should filter alerts by active status", async () => {
      const resActive = await request(app).get("/api/v1/alerts?active=true")
      expect(resActive.status).toBe(200)
      expect(resActive.body.data.alerts.every((a: { active: boolean }) => a.active === true)).toBe(true)

      const resInactive = await request(app).get("/api/v1/alerts?active=false")
      expect(resInactive.status).toBe(200)
      expect(resInactive.body.data.alerts).toHaveLength(0)
    })

    it("should reject invalid alert query parameters", async () => {
      const res = await request(app).get("/api/v1/alerts?severity=catastrophic")
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })
  })

  describe("3. Shelter Locator API (GET /api/v1/shelters)", () => {
    it("should return shelters with parsed facilities array", async () => {
      const res = await request(app).get("/api/v1/shelters")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.count).toBeGreaterThanOrEqual(1)

      const sakhi = res.body.data.shelters.find(
        (s: { name: string }) => s.name === "One Stop Centre (Sakhi)"
      )
      expect(sakhi).toBeDefined()
      expect(Array.isArray(sakhi.facilities)).toBe(true)
      expect(sakhi.womenOnly).toBe(true)
      expect(sakhi.isSample).toBe(true)
      expect(sakhi.disclaimer).toContain("Simulated sample directory")
    })

    it("should filter shelters by womenOnly=true", async () => {
      const res = await request(app).get("/api/v1/shelters?womenOnly=true")
      expect(res.status).toBe(200)
      expect(res.body.data.shelters.every((s: { womenOnly: boolean }) => s.womenOnly === true)).toBe(true)
    })

    it("should filter shelters by status=Confirmed", async () => {
      const res = await request(app).get("/api/v1/shelters?status=Confirmed")
      expect(res.status).toBe(200)
      expect(res.body.data.shelters.every((s: { status: string }) => s.status === "Confirmed")).toBe(true)
    })

    it("should return empty array for non-existent area without crashing", async () => {
      const res = await request(app).get("/api/v1/shelters?area=NowhereTown123")
      expect(res.status).toBe(200)
      expect(res.body.data.count).toBe(0)
      expect(res.body.data.shelters).toHaveLength(0)
    })

    it("should reject invalid shelter status with 400 validation error", async () => {
      const res = await request(app).get("/api/v1/shelters?status=SuperConfirmed")
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })
  })
})
