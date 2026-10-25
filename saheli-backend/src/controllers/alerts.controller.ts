import type { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"

const alertQuerySchema = z.object({
  active: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  area: z.string().trim().optional(),
  severity: z.enum(["info", "warning", "danger"]).optional(),
})

export async function getDisasterAlerts(req: Request, res: Response) {
  const result = alertQuerySchema.safeParse(req.query)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid alert query parameters",
      },
    })
  }

  const { active, area, severity } = result.data

  const whereClause: {
    active?: boolean
    area?: { contains: string }
    severity?: string
  } = {}

  if (active !== undefined) {
    whereClause.active = active
  }
  if (area) {
    whereClause.area = { contains: area }
  }
  if (severity) {
    whereClause.severity = severity
  }

  const alerts = await prisma.disasterAlert.findMany({
    where: whereClause,
    orderBy: { publishedAt: "desc" },
  })

  const formattedAlerts = alerts.map((alert: any) => ({
    id: alert.id,
    title: alert.title,
    severity: alert.severity,
    category: alert.category,
    source: alert.source,
    active: alert.active,
    area: alert.area,
    details: alert.details,
    isSample: alert.isSample,
    disclaimer: alert.isSample
      ? "Simulated sample advisory for test fixtures. Confirm official state disaster feeds (NDMA / SDMA) for real-world advisories."
      : "Official verified emergency broadcast.",
    publishedAt: alert.publishedAt.toISOString(),
  }))

  return res.status(200).json({
    success: true,
    data: {
      alerts: formattedAlerts,
      count: formattedAlerts.length,
      hasLiveFeeds: false, // Transparent disclosure that external real-time feed is not hooked up yet
      notice:
        "Official disaster telemetry requires integration with national/state emergency feeds (e.g. CAP / NDMA API).",
    },
  })
}
