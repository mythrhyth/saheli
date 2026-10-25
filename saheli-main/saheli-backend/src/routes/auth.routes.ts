import { Router } from "express"
import { handleRequestOtp, handleVerifyOtp } from "../controllers/auth.controller.js"

export const authRouter = Router()

// Request an OTP (with rate limiting / cooldown)
authRouter.post("/otp", handleRequestOtp)
authRouter.post("/otp/request", handleRequestOtp)

// Verify OTP & receive JWT token
authRouter.post("/verify", handleVerifyOtp)
authRouter.post("/otp/verify", handleVerifyOtp)
