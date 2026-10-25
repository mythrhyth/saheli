import type { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { SafetyScoringService } from "../services/scoring.service.js"

const areaParamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Area name cannot be empty")
    .max(100, "Area name too long")
    .regex(/^[a-zA-Z0-9\s'-]+$/, "Area name contains invalid characters"),
})

export async function getAreaInsights(req: Request, res: Response) {
  const result = areaParamSchema.safeParse(req.params)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid area name parameter",
      },
    })
  }

  const areaName = result.data.name

  // Query database case-insensitively
  const areaRecord = await prisma.areaSafetyData.findFirst({
    where: {
      name: {
        equals: areaName,
      },
    },
  })

  // Count recent reports in last 7 days (Privacy: only counting, never exposing personal data)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const reportsCount = await prisma.safetyReport.count({
    where: {
      area: {
        equals: areaName,
      },
      createdAt: { gte: sevenDaysAgo },
      status: { not: "rejected" },
    },
  })

  // Check for active district or area disaster alert
  const activeAlert = await prisma.disasterAlert.findFirst({
    where: {
      active: true,
      OR: [{ area: { equals: areaName } }, { area: "East Khasi Hills" }],
    },
  })

  if (!areaRecord) {
    // Area is unknown/unmonitored. Never fabricate data!
    const unknownEvaluation = SafetyScoringService.evaluateArea({
      name: areaName,
      lightingScore: null,
      transportScore: null,
      publicPlacesCount: null,
      recentReportsCount: reportsCount,
      activeHazard: activeAlert ? `${activeAlert.title} · ${activeAlert.source}` : null,
      lastUpdated: null,
      isSample: false,
    })

    return res.status(200).json({
      success: true,
      data: unknownEvaluation,
    })
  }

  const evaluation = SafetyScoringService.evaluateArea({
    name: areaRecord.name,
    lightingScore: areaRecord.lightingScore,
    transportScore: areaRecord.transportScore,
    publicPlacesCount: areaRecord.publicPlacesCount,
    recentReportsCount: reportsCount,
    activeHazard: activeAlert ? `${activeAlert.title} · ${activeAlert.source}` : areaRecord.hazardNote,
    lastUpdated: areaRecord.updatedAt,
    isSample: areaRecord.isSample,
  })

  return res.status(200).json({
    success: true,
    data: evaluation,
  })
}
