import type { Request, Response } from "express"
import { env } from "../config/env.js"

export function getHealth(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "saheli-backend",
      version: "1.0.0",
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      modes: {
        emergencyDelivery: env.EMERGENCY_DELIVERY_MODE,
        aiProvider: env.AI_PROVIDER,
      },
    },
  })
}
