import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma.js"
import { env } from "../config/env.js"

const OTP_EXPIRY_MINUTES = 5
const OTP_RESEND_COOLDOWN_SECONDS = 60
const OTP_MAX_ATTEMPTS = 3

export type AuthTokenPayload = {
  userId: number
  phone: string
}

export class AuthService {
  /**
   * Generates and records a 6-digit OTP.
   * Enforces 60-second cooldown and 5-minute expiry.
   * OTP is hashed using bcrypt before storage.
   */
  static async requestOtp(phone: string): Promise<{ success: boolean; message: string; cooldownRemaining?: number }> {
    const now = new Date()

    // Check existing active OTP for cooldown
    const activeOtp = await prisma.otpVerification.findFirst({
      where: {
        phone,
        consumed: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    })

    if (activeOtp && activeOtp.resendAvailableAt > now) {
      const cooldownRemaining = Math.ceil((activeOtp.resendAvailableAt.getTime() - now.getTime()) / 1000)
      return {
        success: false,
        message: `Please wait ${cooldownRemaining}s before requesting a new OTP.`,
        cooldownRemaining,
      }
    }

    // Invalidate previous unconsumed OTPs for this phone
    await prisma.otpVerification.updateMany({
      where: { phone, consumed: false },
      data: { consumed: true },
    })

    // Generate random 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const salt = await bcrypt.genSalt(10)
    const codeHash = await bcrypt.hash(rawOtp, salt)

    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000)
    const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000)

    await prisma.otpVerification.create({
      data: {
        phone,
        codeHash,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        expiresAt,
        resendAvailableAt,
        consumed: false,
      },
    })

    // Development-only safe console log. NEVER in production.
    if (env.NODE_ENV !== "production") {
      console.log(`[AUTH-DEV-MOCK] OTP for ${phone}: ${rawOtp} (expires in ${OTP_EXPIRY_MINUTES}m)`)
    }

    return {
      success: true,
      message: "If this is a valid phone number, an OTP has been sent.",
    }
  }

  /**
   * Verifies the OTP, enforcing attempt limits and expiry.
   * Creates the user if they do not exist yet.
   * Returns a signed JWT.
   */
  static async verifyOtp(
    phone: string,
    code: string
  ): Promise<{ token: string; user: { id: number; phone: string; name: string; city: string }; isNewUser: boolean }> {
    const now = new Date()

    const record = await prisma.otpVerification.findFirst({
      where: {
        phone,
        consumed: false,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      throw new Error("No active OTP request found. Please request a new OTP.")
    }

    if (record.expiresAt < now) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { consumed: true },
      })
      throw new Error("OTP has expired. Please request a new one.")
    }

    if (record.attempts >= record.maxAttempts) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { consumed: true },
      })
      throw new Error("Maximum attempts exceeded. This OTP has been invalidated.")
    }

    const isMatch = await bcrypt.compare(code, record.codeHash)

    if (!isMatch) {
      const updatedAttempts = record.attempts + 1
      const isNowExhausted = updatedAttempts >= record.maxAttempts

      await prisma.otpVerification.update({
        where: { id: record.id },
        data: {
          attempts: updatedAttempts,
          consumed: isNowExhausted,
        },
      })

      const remaining = record.maxAttempts - updatedAttempts
      if (remaining > 0) {
        throw new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`)
      } else {
        throw new Error("Invalid OTP. Maximum attempts exceeded. Please request a new OTP.")
      }
    }

    // Mark as consumed on success
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { consumed: true },
    })

    // Find or create User
    let user = await prisma.user.findUnique({
      where: { phone },
      include: { preference: true },
    })

    let isNewUser = false
    if (!user) {
      isNewUser = true
      user = await prisma.user.create({
        data: {
          phone,
          preference: {
            create: {},
          },
        },
        include: { preference: true },
      })
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      phone: user.phone,
    }

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" })

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        city: user.city,
      },
      isNewUser,
    }
  }

  /**
   * Verifies a JWT token and decodes payload.
   */
  static verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload
  }
}
