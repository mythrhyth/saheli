import type { Response } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { NotifierService } from "../services/notifier.service.js"
import type { AuthenticatedRequest } from "../middleware/auth.js"

const messageSchema = z.object({
  kind: z.string().min(1),
  title: z.string().min(1).max(150),
  body: z.string().min(1).max(1000),
  recipients: z.array(z.string()).default([]),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().optional(),
    })
    .optional()
    .nullable(),
})

const sosSchema = z.object({
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  accuracy: z.number().optional().nullable(),
  message: z.string().max(500).optional(),
})

export async function postMessage(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId

  const result = messageSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid message payload",
      },
    })
  }

  const { kind, title, body, recipients, location } = result.data

  const record = await NotifierService.dispatch({
    userId,
    kind,
    title,
    body,
    recipients,
    lat: location?.lat,
    lng: location?.lng,
  })

  return res.status(201).json({
    success: true,
    data: {
      message: {
        id: record.id,
        at: record.createdAt.getTime(),
        kind: record.kind,
        title: record.title,
        body: record.body,
        recipients,
        location: location ?? null,
        status: record.status,
      },
    },
  })
}

export async function triggerSos(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId

  const result = sosSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid SOS payload",
      },
    })
  }

  const { lat, lng, message: customMessage } = result.data

  // Duplicate-request protection: reject rapid duplicate SOS triggers within 5 seconds
  const fiveSecondsAgo = new Date(Date.now() - 5000)
  const recentSos = await prisma.emergencyMessage.findFirst({
    where: {
      userId,
      kind: "sos",
      createdAt: { gte: fiveSecondsAgo },
    },
  })

  if (recentSos) {
    return res.status(200).json({
      success: true,
      data: {
        message: "SOS alert already registered.",
        id: recentSos.id,
        status: recentSos.status,
        isDuplicateSuppressed: true,
      },
    })
  }

  // Get user profile and SOS contacts
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { contacts: true, preference: true },
  })

  const userName = user?.name || "Saheli User"
  const sosBody =
    customMessage ||
    user?.preference?.emergencyMessage ||
    `SOS ALERT: ${userName} has triggered an emergency alert on Saheli.`

  const sosContacts =
    user?.contacts
      .filter((c) => c.roles.includes("SOS recipient"))
      .map((c) => c.name) ?? []

  const recipients = sosContacts.length > 0 ? sosContacts : ["All emergency contacts"]

  const record = await NotifierService.dispatch({
    userId,
    kind: "sos",
    title: `EMERGENCY SOS: ${userName}`,
    body: sosBody,
    recipients,
    lat: lat ?? null,
    lng: lng ?? null,
  })

  return res.status(201).json({
    success: true,
    data: {
      id: record.id,
      kind: record.kind,
      title: record.title,
      body: record.body,
      recipients,
      status: record.status,
      createdAt: record.createdAt.getTime(),
      disclaimer: "Simulated SOS alert logged to mock dispatcher. Real SMS/112 carrier calls are disabled.",
    },
  })
}

export async function cancelSos(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { contacts: true },
  })

  const userName = user?.name || "Saheli User"
  const contactNames = user?.contacts.map((c) => c.name) ?? []

  // Create an explicit "sos-cancel" follow-up WITHOUT erasing previous SOS records
  const cancelRecord = await NotifierService.dispatch({
    userId,
    kind: "sos-cancel",
    title: `SOS Cancelled: ${userName} is safe`,
    body: `${userName} has confirmed they are safe and cancelled the SOS alert.`,
    recipients: contactNames.length > 0 ? contactNames : ["All emergency contacts"],
  })

  return res.status(200).json({
    success: true,
    data: {
      message: "SOS cancellation registered and recorded.",
      id: cancelRecord.id,
      status: cancelRecord.status,
    },
  })
}

export async function getMessages(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId

  const messages = await prisma.emergencyMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const formatted = messages.map((m) => {
    let recipients: string[] = []
    try {
      recipients = JSON.parse(m.recipients)
    } catch {
      recipients = [m.recipients]
    }

    return {
      id: m.id,
      at: m.createdAt.getTime(),
      kind: m.kind,
      title: m.title,
      body: m.body,
      recipients,
      location: m.lat && m.lng ? { lat: m.lat, lng: m.lng } : null,
      status: m.status,
    }
  })

  return res.status(200).json({
    success: true,
    data: { messages: formatted },
  })
}
