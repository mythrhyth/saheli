import { describe, it, expect, beforeAll, afterAll } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { SafetyScoringService } from "../src/services/scoring.service.js"

describe("Phase 4: Safety Scoring and Route Comparison API", () => {
  beforeAll(async () => {
    // Ensure seed data exists for tests
    await prisma.areaSafetyData.upsert({
      where: { name: "Polo" },
      update: {
        lightingScore: 0.85,
        transportScore: 0.75,
        publicPlacesCount: 6,
        hazardNote: null,
        isSample: true,
      },
      create: {
        name: "Polo",
        tone: "supported",
        coverage: "Good",
        lightingScore: 0.85,
        transportScore: 0.75,
        publicPlacesCount: 6,
        confidence: "High",
        isSample: true,
      },
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe("1. Explainable Safety Scoring Unit Tests", () => {
    it("should calculate 'Supported by evidence' when all signals are strong and fresh", () => {
      const result = SafetyScoringService.evaluateArea({
        name: "Test Well Lit Area",
        lightingScore: 0.85,
        transportScore: 0.8,
        publicPlacesCount: 6,
        recentReportsCount: 0,
        activeHazard: null,
        lastUpdated: new Date(),
        isSample: false,
      })

      expect(result.safetyStatus).toBe("Supported by evidence")
      expect(result.overallTone).toBe("supported")
      expect(result.confidence).toBe("High")
      expect(result.missingSignals).toHaveLength(0)
      expect(result.isSampleData).toBe(false)
      expect(result.dataSource).toBe("verified_live")
    })

    it("should return 'Caution advised' when an active hazard or recent reports exist", () => {
      const result = SafetyScoringService.evaluateArea({
        name: "Test Hazard Area",
        lightingScore: 0.85,
        transportScore: 0.8,
        publicPlacesCount: 6,
        recentReportsCount: 2,
        activeHazard: "Heavy rain advisory",
        lastUpdated: new Date(),
        isSample: true,
      })

      expect(result.safetyStatus).toBe("Caution advised")
      expect(result.overallTone).toBe("caution")
      expect(result.isSampleData).toBe(true)
      expect(result.explanation.some((e) => e.includes("advisory"))).toBe(true)
    })

    it("should return 'Unknown' with 'None' confidence when all key infrastructure signals are missing", () => {
      const result = SafetyScoringService.evaluateArea({
        name: "Dark Remote Stretch",
        lightingScore: null,
        transportScore: null,
        publicPlacesCount: null,
        recentReportsCount: 0,
        activeHazard: null,
        lastUpdated: null,
      })

      expect(result.safetyStatus).toBe("Unknown")
      expect(result.overallTone).toBe("unknown")
      expect(result.confidence).toBe("None")
      expect(result.missingSignals).toContain("street_lighting")
      expect(result.missingSignals).toContain("public_transport")
      expect(result.missingSignals).toContain("open_public_places")
      expect(result.explanation.some((e) => e.includes("does not fabricate"))).toBe(true)
    })

    it("should downgrade confidence and flag stale data if last update exceeds 24 hours", () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
      const result = SafetyScoringService.evaluateArea({
        name: "Old Survey Area",
        lightingScore: 0.8,
        transportScore: 0.7,
        publicPlacesCount: 4,
        recentReportsCount: 0,
        activeHazard: null,
        lastUpdated: twoDaysAgo,
      })

      expect(result.freshness.isStale).toBe(true)
      expect(result.confidence).toBe("Limited")
      expect(result.safetyStatus).toBe("Limited evidence")
      expect(result.explanation.some((e) => e.includes("older than 24 hours"))).toBe(true)
    })

    it("should never state that an area or route is completely safe", () => {
      const result = SafetyScoringService.evaluateArea({
        name: "Optimal Area",
        lightingScore: 1.0,
        transportScore: 1.0,
        publicPlacesCount: 10,
        recentReportsCount: 0,
        activeHazard: null,
        lastUpdated: new Date(),
      })

      expect(result.safetyDisclaimer).toContain("No area or route is completely safe")
      expect(result.safetyStatus).not.toMatch(/completely safe/i)
      expect(result.overallTone).not.toBe("safe")
    })
  })

  describe("2. Area Insights API (GET /api/v1/areas/:name/insights)", () => {
    it("should return insights with sample disclaimer for seeded area 'Polo'", async () => {
      const res = await request(app).get("/api/v1/areas/Polo/insights")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.area).toBe("Polo")
      expect(res.body.data.isSampleData).toBe(true)
      expect(res.body.data.disclaimer).toContain("simulated demonstration data")
      expect(res.body.data.signals.lighting.status).toBe("known")
      expect(res.body.data.signals.transport.status).toBe("known")
    })

    it("should handle unknown unmonitored areas gracefully with 'Unknown' status", async () => {
      const res = await request(app).get("/api/v1/areas/NonExistentVillage/insights")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.area).toBe("NonExistentVillage")
      expect(res.body.data.safetyStatus).toBe("Unknown")
      expect(res.body.data.confidence).toBe("None")
      expect(res.body.data.missingSignals.length).toBeGreaterThanOrEqual(3)
    })

    it("should reject invalid area names with 400 validation error", async () => {
      const res = await request(app).get("/api/v1/areas/<script>alert(1)<%2Fscript>/insights")
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("should protect privacy and not leak user phone numbers or IDs from reports", async () => {
      // Seed a report with simulated user info in the DB
      const user = await prisma.user.create({
        data: {
          phone: "9998887776",
          name: "Secret User",
          city: "Polo",
        },
      })

      await prisma.safetyReport.create({
        data: {
          userId: user.id,
          category: "Lighting",
          area: "Polo",
          whenDescription: "yesterday",
          detail: "Private detail at address #123",
          anonymous: true,
        },
      })

      const res = await request(app).get("/api/v1/areas/Polo/insights")
      expect(res.status).toBe(200)

      const bodyStr = JSON.stringify(res.body)
      // Must not leak private personal identifiers
      expect(bodyStr).not.toContain("9998887776")
      expect(bodyStr).not.toContain("Secret User")
      expect(bodyStr).not.toContain("address #123")

      // Clean up
      await prisma.safetyReport.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe("3. Route Comparison API (POST /api/v1/routes/compare)", () => {
    it("should compare routes between known demo points and separate travel time from safety", async () => {
      const res = await request(app)
        .post("/api/v1/routes/compare")
        .send({
          origin: "Police Bazaar",
          destination: "Laitumkhrah",
          mode: "Walk",
          timeOfDay: "Evening",
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe("compared")
      expect(res.body.data.isSampleData).toBe(true)
      expect(res.body.data.routes).toHaveLength(3)

      const routeA = res.body.data.routes[0]
      expect(routeA.name).toBe("Route A")
      expect(routeA.travelMetrics.distanceKm).toBe(4.2)
      expect(routeA.travelMetrics.estimatedMinutes).toBeGreaterThan(0)
      expect(routeA.safetyEvidence).toBeDefined()
      expect(routeA.tradeOffSummary).toBeDefined()
      expect(res.body.data.safetyDisclaimer).toContain("No route can be guaranteed as completely safe")
    })

    it("should return 'insufficient_data' without fabricating fake routes for unmapped areas", async () => {
      const res = await request(app)
        .post("/api/v1/routes/compare")
        .send({
          origin: "Mumbai",
          destination: "Pune",
          mode: "Walk",
          timeOfDay: "Night",
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe("insufficient_data")
      expect(res.body.data.availableRoutes).toHaveLength(0)
      expect(res.body.data.message).toContain("Saheli does not fabricate")
    })

    it("should reject invalid comparison requests with 400 validation error", async () => {
      const res = await request(app)
        .post("/api/v1/routes/compare")
        .send({
          origin: "", // invalid empty string
          destination: "Polo",
        })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })
  })
})
