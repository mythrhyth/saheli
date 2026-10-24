import type { Request, Response } from "express"
import crypto from "crypto"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import type { AuthenticatedRequest } from "../middleware/auth.js"

const createSharingSchema = z.object({
  contactIds: z.array(z.number().int()).default([]),
  durationMinutes: z.number().int().min(5).max(480).default(60),
})

const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional().nullable(),
})

export async function createSharingSession(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId

  const result = createSharingSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid sharing parameters",
      },
    })
  }

  const { contactIds, durationMinutes } = result.data

  // End any currently live sessions for this user
  await prisma.sharingSession.updateMany({
    where: { userId, status: "live" },
    data: { status: "ended" },
  })

  // Generate a cryptographically secure, unguessable public tracking token
  const publicToken = crypto.randomBytes(24).toString("hex")
  const now = new Date()
  const endsAt = new Date(now.getTime() + durationMinutes * 60 * 1000)

  const session = await prisma.sharingSession.create({
    data: {
      userId,
      publicToken,
      contactIds: JSON.stringify(contactIds),
      status: "live",
      startedAt: now,
      endsAt,
    },
  })

  return res.status(201).json({
    success: true,
    data: {
      session: {
        id: session.id,
        contactIds,
        status: session.status,
        startedAt: session.startedAt.getTime(),
        endsAt: session.endsAt?.getTime() ?? null,
        publicToken: session.publicToken,
        publicTrackingUrl: `/api/v1/sharing/public/${session.publicToken}`,
      },
    },
  })
}

export async function getActiveSharingSession(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId

  const session = await prisma.sharingSession.findFirst({
    where: { userId, status: { in: ["live", "paused"] } },
    orderBy: { startedAt: "desc" },
    include: {
      locations: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  })

  if (!session) {
    return res.status(200).json({
      success: true,
      data: { session: null },
    })
  }

  let contactIds: number[] = []
  try {
    contactIds = JSON.parse(session.contactIds)
  } catch {
    contactIds = []
  }

  const latest = session.locations[0]

  return res.status(200).json({
    success: true,
    data: {
      session: {
        id: session.id,
        contactIds,
        status: session.status,
        startedAt: session.startedAt.getTime(),
        endsAt: session.endsAt?.getTime() ?? null,
        publicToken: session.publicToken,
        latestLocation: latest
          ? {
              lat: latest.lat,
              lng: latest.lng,
              accuracy: latest.accuracy,
              recordedAt: latest.recordedAt.toISOString(),
            }
          : null,
      },
    },
  })
}

export async function updateSessionStatus(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId
  const sessionId = Number(req.params.id)
  const action = String(req.params.action || "") // pause | resume | end

  if (isNaN(sessionId) || !["pause", "resume", "end"].includes(action)) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_REQUEST", message: "Invalid session ID or action" },
    })
  }

  const existing = await prisma.sharingSession.findFirst({
    where: { id: sessionId, userId },
  })

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Sharing session not found or access denied" },
    })
  }

  let newStatus = existing.status
  if (action === "pause") newStatus = "paused"
  if (action === "resume") newStatus = "live"
  if (action === "end") newStatus = "ended"

  const updated = await prisma.sharingSession.update({
    where: { id: sessionId },
    data: { status: newStatus },
  })

  return res.status(200).json({
    success: true,
    data: {
      id: updated.id,
      status: updated.status,
      message: `Session is now ${updated.status}.`,
    },
  })
}

export async function postLocationUpdate(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId
  const sessionId = Number(req.params.id)

  if (isNaN(sessionId)) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid session ID" },
    })
  }

  const session = await prisma.sharingSession.findFirst({
    where: { id: sessionId, userId, status: "live" },
  })

  if (!session) {
    return res.status(400).json({
      success: false,
      error: {
        code: "SESSION_INACTIVE",
        message: "Cannot update location on an inactive or expired sharing session.",
      },
    })
  }

  const result = locationUpdateSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid location coordinates",
      },
    })
  }

  const { lat, lng, accuracy } = result.data

  const location = await prisma.sharingLocation.create({
    data: {
      sessionId,
      lat,
      lng,
      accuracy: accuracy ?? null,
    },
  })

  // Privacy & database retention: retain only the latest 10 location breadcrumbs
  const count = await prisma.sharingLocation.count({ where: { sessionId } })
  if (count > 10) {
    const oldest = await prisma.sharingLocation.findFirst({
      where: { sessionId },
      orderBy: { recordedAt: "asc" },
    })
    if (oldest) {
      await prisma.sharingLocation.delete({ where: { id: oldest.id } })
    }
  }

  return res.status(201).json({
    success: true,
    data: {
      id: location.id,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      recordedAt: location.recordedAt.toISOString(),
    },
  })
}

/**
 * PUBLIC RECIPIENT ENDPOINT
 * Does not require auth. Accessible only via the unguessable publicToken.
 * STRICT PRIVACY: NEVER returns user profile, phone number, or user ID.
 */
export async function getPublicLocation(req: Request, res: Response) {
  const token = String(req.params.token || "")

  if (!token || token.length < 20) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Invalid tracking token" },
    })
  }

  const session = await prisma.sharingSession.findUnique({
    where: { publicToken: token },
    include: {
      locations: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  })

  if (!session) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Sharing link not found or expired." },
    })
  }

  const now = new Date()
  const isExpired = session.endsAt ? session.endsAt <= now : false

  // If session is ended, paused, or expired, do NOT expose live location
  if (session.status === "ended" || isExpired) {
    return res.status(200).json({
      success: true,
      data: {
        status: isExpired ? "expired" : "ended",
        message: "This live location sharing session has ended.",
        latestLocation: null,
      },
    })
  }

  if (session.status === "paused") {
    return res.status(200).json({
      success: true,
      data: {
        status: "paused",
        message: "Location sharing is currently paused by the user.",
        latestLocation: null,
      },
    })
  }

  const latest = session.locations[0]

  return res.status(200).json({
    success: true,
    data: {
      status: "live",
      expiresAt: session.endsAt?.toISOString() ?? null,
      latestLocation: latest
        ? {
            lat: latest.lat,
            lng: latest.lng,
            accuracy: latest.accuracy,
            recordedAt: latest.recordedAt.toISOString(),
          }
        : null,
    },
  })
}
