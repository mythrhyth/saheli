import type { Response } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import type { AuthenticatedRequest } from "../middleware/auth.js"

const updateProfileSchema = z.object({
  name: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  emergencyPrefs: z
    .object({
      countdown: z.number().int().min(3).max(30).optional(),
      includeLocation: z.boolean().optional(),
      repeatMins: z.number().int().min(1).max(60).optional(),
      message: z.string().max(300).optional(),
      showCall112: z.boolean().optional(),
    })
    .optional(),
  notifPrefs: z
    .object({
      checkin: z.boolean().optional(),
      sharing: z.boolean().optional(),
      alerts: z.boolean().optional(),
      reports: z.boolean().optional(),
    })
    .optional(),
})

export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { preference: true },
  })

  if (!user) {
    return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } })
  }

  return res.status(200).json({
    success: true,
    data: {
      profile: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        city: user.city,
      },
      emergencyPrefs: {
        countdown: user.preference?.emergencyCountdown ?? 10,
        includeLocation: user.preference?.emergencyIncludeLocation ?? true,
        repeatMins: user.preference?.emergencyRepeatMins ?? 5,
        message: user.preference?.emergencyMessage ?? "I need help. This is an SOS alert from Saheli.",
        showCall112: user.preference?.emergencyShowCall112 ?? true,
      },
      notifPrefs: {
        checkin: user.preference?.notifCheckin ?? true,
        sharing: user.preference?.notifSharing ?? true,
        alerts: user.preference?.notifAlerts ?? true,
        reports: user.preference?.notifReports ?? true,
      },
    },
  })
}

export async function updateMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } })
  }

  const result = updateProfileSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid payload",
      },
    })
  }

  const { name, city, emergencyPrefs, notifPrefs } = result.data

  const updatedUser = await prisma.user.update({
    where: { id: req.user.userId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(city !== undefined ? { city } : {}),
      preference: {
        upsert: {
          create: {
            emergencyCountdown: emergencyPrefs?.countdown ?? 10,
            emergencyIncludeLocation: emergencyPrefs?.includeLocation ?? true,
            emergencyRepeatMins: emergencyPrefs?.repeatMins ?? 5,
            emergencyMessage: emergencyPrefs?.message ?? "I need help. This is an SOS alert from Saheli.",
            emergencyShowCall112: emergencyPrefs?.showCall112 ?? true,
            notifCheckin: notifPrefs?.checkin ?? true,
            notifSharing: notifPrefs?.sharing ?? true,
            notifAlerts: notifPrefs?.alerts ?? true,
            notifReports: notifPrefs?.reports ?? true,
          },
          update: {
            ...(emergencyPrefs?.countdown !== undefined ? { emergencyCountdown: emergencyPrefs.countdown } : {}),
            ...(emergencyPrefs?.includeLocation !== undefined ? { emergencyIncludeLocation: emergencyPrefs.includeLocation } : {}),
            ...(emergencyPrefs?.repeatMins !== undefined ? { emergencyRepeatMins: emergencyPrefs.repeatMins } : {}),
            ...(emergencyPrefs?.message !== undefined ? { emergencyMessage: emergencyPrefs.message } : {}),
            ...(emergencyPrefs?.showCall112 !== undefined ? { emergencyShowCall112: emergencyPrefs.showCall112 } : {}),
            ...(notifPrefs?.checkin !== undefined ? { notifCheckin: notifPrefs.checkin } : {}),
            ...(notifPrefs?.sharing !== undefined ? { notifSharing: notifPrefs.sharing } : {}),
            ...(notifPrefs?.alerts !== undefined ? { notifAlerts: notifPrefs.alerts } : {}),
            ...(notifPrefs?.reports !== undefined ? { notifReports: notifPrefs.reports } : {}),
          },
        },
      },
    },
    include: { preference: true },
  })

  return res.status(200).json({
    success: true,
    data: {
      profile: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        city: updatedUser.city,
      },
      emergencyPrefs: {
        countdown: updatedUser.preference?.emergencyCountdown,
        includeLocation: updatedUser.preference?.emergencyIncludeLocation,
        repeatMins: updatedUser.preference?.emergencyRepeatMins,
        message: updatedUser.preference?.emergencyMessage,
        showCall112: updatedUser.preference?.emergencyShowCall112,
      },
      notifPrefs: {
        checkin: updatedUser.preference?.notifCheckin,
        sharing: updatedUser.preference?.notifSharing,
        alerts: updatedUser.preference?.notifAlerts,
        reports: updatedUser.preference?.notifReports,
      },
    },
  })
}
