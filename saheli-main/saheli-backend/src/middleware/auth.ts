import type { Request, Response, NextFunction } from "express"
import { AuthService, type AuthTokenPayload } from "../services/auth.service.js"

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token required.",
      },
    })
  }

  const token = authHeader.substring(7).trim()

  try {
    const payload = AuthService.verifyToken(token)
    req.user = payload
    next()
  } catch (_err) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired authentication token.",
      },
    })
  }
}
