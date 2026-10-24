import type { Response } from "express"
import { z } from "zod"
import type { AuthenticatedRequest } from "../middleware/auth.js"
import { CheckInService } from "../services/checkin.service.js"

const createCheckInSchema = z.object({
  label: z.string().trim().max(100).optional(),
  intervalMinutes: z.number().int().min(1).max(240).optional(),
  graceMinutes: z.number().int().min(1).max(60).optional(),
})

const extendCheckInSchema = z.object({
  extraMinutes: z.number().int().min(1).max(60).default(10),
})

export async function createCheckIn(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId

  const result = createCheckInSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid check-in parameters",
      },
    })
  }

  const session = await CheckInService.startCheckIn(userId, result.data)

  return res.status(201).json({
    success: true,
    data: {
      checkIn: {
        id: session.id,
        label: session.label,
        interval: session.intervalMinutes,
        grace: session.graceMinutes,
        startedAt: session.startedAt.getTime(),
        dueAt: session.dueAt.getTime(),
        status: session.status,
      },
    },
  })
}

export async function getActiveCheckIn(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId
  const session = await CheckInService.getActiveCheckIn(userId)

  if (!session) {
    return res.status(200).json({
      success: true,
      data: { checkIn: null },
    })
  }

  return res.status(200).json({
    success: true,
    data: {
      checkIn: {
        id: session.id,
        label: session.label,
        interval: session.intervalMinutes,
        grace: session.graceMinutes,
        startedAt: session.startedAt.getTime(),
        dueAt: session.dueAt.getTime(),
        status: session.status,
      },
    },
  })
}

export async function confirmSafe(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId
  const checkinId = Number(req.params.id)

  if (isNaN(checkinId)) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid check-in ID" },
    })
  }

  try {
    const updated = await CheckInService.markSafe(userId, checkinId)
    return res.status(200).json({
      success: true,
      data: {
        message: "Check-in confirmed safe.",
        status: updated.status,
      },
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: "CHECKIN_ERROR",
        message: err instanceof Error ? err.message : "Failed to mark safe",
      },
    })
  }
}

export async function extendTime(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId
  const checkinId = Number(req.params.id)

  if (isNaN(checkinId)) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid check-in ID" },
    })
  }

  const result = extendCheckInSchema.safeParse(req.body)
  const extraMinutes = result.success ? result.data.extraMinutes : 10

  try {
    const updated = await CheckInService.extendCheckIn(userId, checkinId, extraMinutes)
    return res.status(200).json({
      success: true,
      data: {
        message: `Extended check-in by ${extraMinutes} minutes.`,
        dueAt: updated.dueAt.getTime(),
        interval: updated.intervalMinutes,
      },
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: "CHECKIN_ERROR",
        message: err instanceof Error ? err.message : "Failed to extend check-in",
      },
    })
  }
}

export async function cancelCheckIn(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId
  const checkinId = Number(req.params.id)

  if (isNaN(checkinId)) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid check-in ID" },
    })
  }

  try {
    await CheckInService.cancelCheckIn(userId, checkinId)
    return res.status(200).json({
      success: true,
      data: { message: "Check-in cancelled." },
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: "CHECKIN_ERROR",
        message: err instanceof Error ? err.message : "Failed to cancel check-in",
      },
    })
  }
}
