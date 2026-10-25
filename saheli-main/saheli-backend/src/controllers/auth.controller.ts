import type { Request, Response } from "express"
import { z } from "zod"
import { AuthService } from "../services/auth.service.js"

const requestOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
})

const verifyOtpSchema = z.object({
  phone: z.string().trim().min(10),
  code: z.string().trim().length(6, "OTP must be exactly 6 digits"),
})

export async function handleRequestOtp(req: Request, res: Response) {
  const result = requestOtpSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid phone number",
      },
    })
  }

  const { phone } = result.data
  const outcome = await AuthService.requestOtp(phone)

  if (!outcome.success) {
    return res.status(429).json({
      success: false,
      error: {
        code: "COOLDOWN_ACTIVE",
        message: outcome.message,
        cooldownRemaining: outcome.cooldownRemaining,
      },
    })
  }

  return res.status(200).json({
    success: true,
    data: {
      message: outcome.message,
    },
  })
}

export async function handleVerifyOtp(req: Request, res: Response) {
  const result = verifyOtpSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid OTP payload",
      },
    })
  }

  const { phone, code } = result.data

  try {
    const { token, user, isNewUser } = await AuthService.verifyOtp(phone, code)
    return res.status(200).json({
      success: true,
      data: {
        token,
        user,
        isNewUser,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed"
    return res.status(400).json({
      success: false,
      error: {
        code: "OTP_VERIFICATION_FAILED",
        message,
      },
    })
  }
}
