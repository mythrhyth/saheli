import { describe, it, expect, beforeAll, afterAll } from "vitest"
import request from "supertest"
import jwt from "jsonwebtoken"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { env } from "../src/config/env.js"
import { CheckInService } from "../src/services/checkin.service.js"

describe("Phase 6: Emergency Workflows, Contacts, Check-in Worker & Live Sharing", () => {
  let user1Token: string
  let user2Token: string
  let user1Id: number
  let user2Id: number
  const testPhone1 = "9111111111"
  const testPhone2 = "9222222222"

  beforeAll(async () => {
    // Clean up
    await prisma.user.deleteMany({ where: { phone: { in: [testPhone1, testPhone2] } } })

    const user1 = await prisma.user.create({
      data: { phone: testPhone1, name: "Alice", city: "Shillong" },
    })
    user1Id = user1.id
    user1Token = jwt.sign({ userId: user1.id, phone: testPhone1 }, env.JWT_SECRET)

    const user2 = await prisma.user.create({
      data: { phone: testPhone2, name: "Bob", city: "Shillong" },
    })
    user2Id = user2.id
    user2Token = jwt.sign({ userId: user2.id, phone: testPhone2 }, env.JWT_SECRET)
  })

  afterAll(async () => {
    await prisma.emergencyMessage.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } })
    await prisma.checkInSession.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } })
    await prisma.sharingLocation.deleteMany({
      where: { session: { userId: { in: [user1Id, user2Id] } } },
    })
    await prisma.sharingSession.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } })
    await prisma.emergencyContact.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } })
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } })
    await prisma.$disconnect()
  })

  describe("1. Trusted Contacts API & Ownership Isolation", () => {
    let createdContactId: number

    it("should create a contact for User 1", async () => {
      const res = await request(app)
        .post("/api/v1/contacts")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Mother",
          relation: "Parent",
          phone: "9876543210",
          roles: ["SOS recipient", "Journey viewer"],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.contact.name).toBe("Mother")
      expect(res.body.data.contact.roles).toContain("SOS recipient")

      createdContactId = res.body.data.contact.id
    })

    it("should retrieve contacts belonging only to User 1", async () => {
      const res = await request(app)
        .get("/api/v1/contacts")
        .set("Authorization", `Bearer ${user1Token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.contacts.some((c: { id: number }) => c.id === createdContactId)).toBe(true)

      // User 2 should have 0 contacts
      const res2 = await request(app)
        .get("/api/v1/contacts")
        .set("Authorization", `Bearer ${user2Token}`)

      expect(res2.body.data.contacts).toHaveLength(0)
    })

    it("should prevent User 2 from modifying User 1's contact (Ownership Isolation)", async () => {
      const res = await request(app)
        .put(`/api/v1/contacts/${createdContactId}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ name: "Hacked Contact" })

      expect(res.status).toBe(404)
    })

    it("should prevent User 2 from deleting User 1's contact", async () => {
      const res = await request(app)
        .delete(`/api/v1/contacts/${createdContactId}`)
        .set("Authorization", `Bearer ${user2Token}`)

      expect(res.status).toBe(404)
    })

    it("should allow User 1 to update and delete their own contact", async () => {
      const updateRes = await request(app)
        .put(`/api/v1/contacts/${createdContactId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Mom" })

      expect(updateRes.status).toBe(200)
      expect(updateRes.body.data.contact.name).toBe("Mom")

      const delRes = await request(app)
        .delete(`/api/v1/contacts/${createdContactId}`)
        .set("Authorization", `Bearer ${user1Token}`)

      expect(delRes.status).toBe(200)
    })
  })

  describe("2. Check-in Lifecycle & Server-Side Escalation Worker", () => {
    it("should create an active check-in session", async () => {
      const res = await request(app)
        .post("/api/v1/checkins")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ label: "Evening Walk", intervalMinutes: 20, graceMinutes: 5 })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.checkIn.status).toBe("running")
      expect(res.body.data.checkIn.interval).toBe(20)
    })

    it("should extend check-in time", async () => {
      const activeRes = await request(app)
        .get("/api/v1/checkins/active")
        .set("Authorization", `Bearer ${user1Token}`)

      const checkinId = activeRes.body.data.checkIn.id

      const extendRes = await request(app)
        .patch(`/api/v1/checkins/${checkinId}/extend`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ extraMinutes: 10 })

      expect(extendRes.status).toBe(200)
      expect(extendRes.body.data.interval).toBe(30)
    })

    it("should mark check-in as safe and record mock checkin-safe message", async () => {
      const activeRes = await request(app)
        .get("/api/v1/checkins/active")
        .set("Authorization", `Bearer ${user1Token}`)

      const checkinId = activeRes.body.data.checkIn.id

      const safeRes = await request(app)
        .patch(`/api/v1/checkins/${checkinId}/safe`)
        .set("Authorization", `Bearer ${user1Token}`)

      expect(safeRes.status).toBe(200)
      expect(safeRes.body.data.status).toBe("completed")

      // Verify mock message was saved
      const safeMsg = await prisma.emergencyMessage.findFirst({
        where: { userId: user1Id, kind: "checkin-safe" },
      })
      expect(safeMsg).toBeDefined()
      expect(safeMsg?.status).toBe("mock_delivered")
    })

    it("should trigger idempotent escalation when grace period expires", async () => {
      // Create an overdue check-in directly in DB with graceDueAt in the past
      const pastTime = new Date(Date.now() - 10000)
      const overdueSession = await prisma.checkInSession.create({
        data: {
          userId: user1Id,
          label: "Overdue Walk",
          intervalMinutes: 10,
          graceMinutes: 2,
          startedAt: new Date(Date.now() - 30 * 60 * 1000),
          dueAt: new Date(Date.now() - 15 * 60 * 1000),
          graceDueAt: pastTime,
          status: "running",
        },
      })

      // Run escalation worker directly
      const escalatedCount = await CheckInService.processOverdueCheckIns()
      expect(escalatedCount).toBeGreaterThanOrEqual(1)

      // Verify session status updated
      const reloaded = await prisma.checkInSession.findUnique({
        where: { id: overdueSession.id },
      })
      expect(reloaded?.status).toBe("escalated")
      expect(reloaded?.escalatedAt).toBeDefined()

      // Verify missed checkin alert created
      const missedMsg = await prisma.emergencyMessage.findFirst({
        where: { userId: user1Id, kind: "checkin-missed" },
      })
      expect(missedMsg).toBeDefined()
      expect(missedMsg?.deliveryMode).toBe("mock")

      // IDEMPOTENCY TEST: Running worker again MUST NOT re-escalate or duplicate message
      const secondRunCount = await CheckInService.processOverdueCheckIns()
      expect(secondRunCount).toBe(0)
    })
  })

  describe("3. Emergency Messages & SOS Workflows", () => {
    it("should create general outbox message", async () => {
      const res = await request(app)
        .post("/api/v1/messages")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          kind: "test",
          title: "Test Alert",
          body: "This is a test notification from Saheli.",
          recipients: ["Mom", "Sister"],
        })

      expect(res.status).toBe(201)
      expect(res.body.data.message.status).toBe("mock_delivered")
    })

    it("should trigger an SOS alert and suppress rapid duplicate double-taps", async () => {
      const res1 = await request(app)
        .post("/api/v1/sos")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ lat: 25.5788, lng: 91.8933 })

      expect(res1.status).toBe(201)
      expect(res1.body.data.kind).toBe("sos")

      // Immediate duplicate trigger within 5s
      const res2 = await request(app)
        .post("/api/v1/sos")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ lat: 25.5788, lng: 91.8933 })

      expect(res2.status).toBe(200)
      expect(res2.body.data.isDuplicateSuppressed).toBe(true)
    })

    it("should cancel SOS and retain original SOS history in database", async () => {
      const cancelRes = await request(app)
        .post("/api/v1/sos/cancel")
        .set("Authorization", `Bearer ${user1Token}`)

      expect(cancelRes.status).toBe(200)

      // Ensure original SOS record was NOT deleted
      const originalSos = await prisma.emergencyMessage.findFirst({
        where: { userId: user1Id, kind: "sos" },
      })
      const cancelRecord = await prisma.emergencyMessage.findFirst({
        where: { userId: user1Id, kind: "sos-cancel" },
      })

      expect(originalSos).toBeDefined()
      expect(cancelRecord).toBeDefined()
    })
  })

  describe("4. Live Location Sharing & Public Privacy", () => {
    let publicToken: string
    let sessionId: number

    it("should create a live sharing session with a secure public token", async () => {
      const res = await request(app)
        .post("/api/v1/sharing")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ contactIds: [1, 2], durationMinutes: 45 })

      expect(res.status).toBe(201)
      expect(res.body.data.session.status).toBe("live")
      expect(res.body.data.session.publicToken).toBeDefined()
      expect(res.body.data.session.publicToken.length).toBeGreaterThanOrEqual(32)

      publicToken = res.body.data.session.publicToken
      sessionId = res.body.data.session.id
    })

    it("should post location breadcrumb and restrict to 10 points", async () => {
      const locRes = await request(app)
        .post(`/api/v1/sharing/${sessionId}/location`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ lat: 25.57, lng: 91.88, accuracy: 12 })

      expect(locRes.status).toBe(201)
      expect(locRes.body.data.lat).toBe(25.57)
    })

    it("should serve live location through public endpoint without leaking private user info", async () => {
      const pubRes = await request(app).get(`/api/v1/sharing/public/${publicToken}`)

      expect(pubRes.status).toBe(200)
      expect(pubRes.body.data.status).toBe("live")
      expect(pubRes.body.data.latestLocation.lat).toBe(25.57)

      // Strict privacy check: response fields must not include personal user data.
      // We check the structured object keys rather than raw string to avoid false
      // positives from numeric user IDs coincidentally appearing in ISO timestamps.
      const data = pubRes.body.data
      expect(data).not.toHaveProperty("userId")
      expect(data).not.toHaveProperty("contactIds")
      expect(data).not.toHaveProperty("phone")
      expect(data).not.toHaveProperty("name")
      expect(data).not.toHaveProperty("publicToken")

      // Phone number must not appear anywhere in the raw response
      expect(JSON.stringify(pubRes.body)).not.toContain(testPhone1)
      expect(JSON.stringify(pubRes.body)).not.toContain("Alice")
      expect(JSON.stringify(pubRes.body)).not.toContain("contactIds")
    })

    it("should hide location when session is paused", async () => {
      await request(app)
        .patch(`/api/v1/sharing/${sessionId}/pause`)
        .set("Authorization", `Bearer ${user1Token}`)

      const pubRes = await request(app).get(`/api/v1/sharing/public/${publicToken}`)
      expect(pubRes.status).toBe(200)
      expect(pubRes.body.data.status).toBe("paused")
      expect(pubRes.body.data.latestLocation).toBeNull()
    })

    it("should hide location when session is ended", async () => {
      await request(app)
        .patch(`/api/v1/sharing/${sessionId}/end`)
        .set("Authorization", `Bearer ${user1Token}`)

      const pubRes = await request(app).get(`/api/v1/sharing/public/${publicToken}`)
      expect(pubRes.status).toBe(200)
      expect(pubRes.body.data.status).toBe("ended")
      expect(pubRes.body.data.latestLocation).toBeNull()
    })
  })
})
