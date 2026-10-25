import { describe, it, expect, beforeAll, afterAll } from "vitest"
import request from "supertest"
import bcrypt from "bcryptjs"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"

describe("Phase 3: Database & Authentication API", () => {
  const testPhone = "9876543210"
  const attemptPhone = "9123456780"
  const expiredPhone = "9000000001"
  const successPhone = "9988776655"
  const allPhones = [testPhone, attemptPhone, expiredPhone, successPhone]
  let validToken: string

  beforeAll(async () => {
    // Clean up test data
    await prisma.otpVerification.deleteMany({ where: { phone: { in: allPhones } } })
    await prisma.user.deleteMany({ where: { phone: { in: allPhones } } })
  })

  afterAll(async () => {
    await prisma.otpVerification.deleteMany({ where: { phone: { in: allPhones } } })
    await prisma.user.deleteMany({ where: { phone: { in: allPhones } } })
    await prisma.$disconnect()
  })

  describe("1. OTP Generation & Cooldown", () => {
    it("should successfully request an OTP for a valid phone number", async () => {
      const res = await request(app)
        .post("/api/v1/auth/otp")
        .send({ phone: testPhone })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.message).toContain("If this is a valid phone number")

      // Verify OTP is stored hashed in database
      const record = await prisma.otpVerification.findFirst({
        where: { phone: testPhone, consumed: false },
        orderBy: { createdAt: "desc" },
      })
      expect(record).toBeDefined()
      expect(record?.codeHash).toBeDefined()
      expect(record?.codeHash).not.toBe("123456") // Never plain text
    })

    it("should reject rapid OTP requests within the 60-second cooldown", async () => {
      const res = await request(app)
        .post("/api/v1/auth/otp")
        .send({ phone: testPhone })

      expect(res.status).toBe(429)
      expect(res.body.success).toBe(false)
      expect(res.body.error.code).toBe("COOLDOWN_ACTIVE")
      expect(res.body.error.cooldownRemaining).toBeGreaterThan(0)
    })
  })

  describe("2. OTP Verification & Attempt Limits", () => {
    const attemptPhone = "9123456780"

    beforeAll(async () => {
      await prisma.otpVerification.deleteMany({ where: { phone: attemptPhone } })
      // Seed a known OTP: 654321
      const salt = await bcrypt.genSalt(10)
      const codeHash = await bcrypt.hash("654321", salt)
      const now = new Date()

      await prisma.otpVerification.create({
        data: {
          phone: attemptPhone,
          codeHash,
          attempts: 0,
          maxAttempts: 3,
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          resendAvailableAt: new Date(now.getTime() + 60 * 1000),
          consumed: false,
        },
      })
    })

    it("should reject an invalid OTP and track remaining attempts", async () => {
      const res = await request(app)
        .post("/api/v1/auth/verify")
        .send({ phone: attemptPhone, code: "000000" })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.error.message).toContain("2 attempt(s) remaining")
    })

    it("should invalidate the OTP when maximum attempts (3) are exceeded", async () => {
      // 2nd wrong attempt
      await request(app).post("/api/v1/auth/verify").send({ phone: attemptPhone, code: "000000" })

      // 3rd wrong attempt
      const res = await request(app)
        .post("/api/v1/auth/verify")
        .send({ phone: attemptPhone, code: "000000" })

      expect(res.status).toBe(400)
      expect(res.body.error.message).toContain("Maximum attempts exceeded")

      // Attempting the correct code now must still fail
      const correctRes = await request(app)
        .post("/api/v1/auth/verify")
        .send({ phone: attemptPhone, code: "654321" })

      expect(correctRes.status).toBe(400)
    })

    it("should reject an expired OTP", async () => {
      const expiredPhone = "9000000001"
      const salt = await bcrypt.genSalt(10)
      const codeHash = await bcrypt.hash("112233", salt)

      await prisma.otpVerification.create({
        data: {
          phone: expiredPhone,
          codeHash,
          attempts: 0,
          maxAttempts: 3,
          expiresAt: new Date(Date.now() - 1000), // In the past
          resendAvailableAt: new Date(Date.now() - 1000),
          consumed: false,
        },
      })

      const res = await request(app)
        .post("/api/v1/auth/verify")
        .send({ phone: expiredPhone, code: "112233" })

      expect(res.status).toBe(400)
      expect(res.body.error.message).toContain("expired")
    })

    it("should successfully verify a correct OTP and return a JWT token", async () => {
      const successPhone = "9988776655"
      const salt = await bcrypt.genSalt(10)
      const codeHash = await bcrypt.hash("889900", salt)

      await prisma.otpVerification.create({
        data: {
          phone: successPhone,
          codeHash,
          attempts: 0,
          maxAttempts: 3,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          resendAvailableAt: new Date(Date.now() + 60 * 1000),
          consumed: false,
        },
      })

      const res = await request(app)
        .post("/api/v1/auth/verify")
        .send({ phone: successPhone, code: "889900" })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.token).toBeDefined()
      expect(res.body.data.user.phone).toBe(successPhone)
      expect(res.body.data.isNewUser).toBe(true)

      validToken = res.body.data.token
    })
  })

  describe("3. JWT Authorization & Profile Access (/api/v1/me)", () => {
    it("should return 401 UNAUTHORIZED when no authorization header is sent", async () => {
      const res = await request(app).get("/api/v1/me")
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("should return 401 INVALID_TOKEN when an invalid bearer token is sent", async () => {
      const res = await request(app)
        .get("/api/v1/me")
        .set("Authorization", "Bearer invalid-tampered-token-123")

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe("INVALID_TOKEN")
    })

    it("should return the user profile and preferences when authenticated", async () => {
      const res = await request(app)
        .get("/api/v1/me")
        .set("Authorization", `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.profile.phone).toBe("9988776655")
      expect(res.body.data.emergencyPrefs.countdown).toBe(10)
      expect(res.body.data.notifPrefs.checkin).toBe(true)
    })

    it("should update profile and preferences via PUT /api/v1/me", async () => {
      const res = await request(app)
        .put("/api/v1/me")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          name: "Maya Roy",
          city: "Shillong",
          emergencyPrefs: {
            countdown: 5,
            message: "Custom emergency alert text.",
          },
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.profile.name).toBe("Maya Roy")
      expect(res.body.data.profile.city).toBe("Shillong")
      expect(res.body.data.emergencyPrefs.countdown).toBe(5)
      expect(res.body.data.emergencyPrefs.message).toBe("Custom emergency alert text.")
    })
  })
})
