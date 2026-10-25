import type { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"

const shelterQuerySchema = z.object({
  womenOnly: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  accessible: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  open24: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  area: z.string().trim().optional(),
  status: z.enum(["Confirmed", "Reported", "Unknown"]).optional(),
})

export async function getShelters(req: Request, res: Response) {
  const result = shelterQuerySchema.safeParse(req.query)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid shelter query parameters",
      },
    })
  }

  const { womenOnly, accessible, open24, area, status } = result.data

  const whereClause: {
    womenOnly?: boolean
    accessible?: boolean
    open24?: boolean
    area?: { contains: string }
    status?: string
  } = {}

  if (womenOnly !== undefined) whereClause.womenOnly = womenOnly
  if (accessible !== undefined) whereClause.accessible = accessible
  if (open24 !== undefined) whereClause.open24 = open24
  if (area) whereClause.area = { contains: area }
  if (status) whereClause.status = status

  const shelters = await prisma.shelter.findMany({
    where: whereClause,
    orderBy: { distanceKm: "asc" },
  })

  const formattedShelters = shelters.map((shelter: any) => {
    let parsedFacilities: string[] = []
    try {
      parsedFacilities = JSON.parse(shelter.facilities)
    } catch {
      parsedFacilities = []
    }

    return {
      id: shelter.id,
      name: shelter.name,
      type: shelter.type,
      status: shelter.status as "Confirmed" | "Reported" | "Unknown",
      distanceKm: shelter.distanceKm,
      area: shelter.area,
      womenOnly: shelter.womenOnly,
      accessible: shelter.accessible,
      open24: shelter.open24,
      facilities: parsedFacilities,
      phone: shelter.phone,
      accessNotes: shelter.accessNotes,
      isSample: shelter.isSample,
      disclaimer: shelter.isSample
        ? "Simulated sample directory. Always verify current operating status via phone or emergency services (181/112)."
        : "Verified municipal shelter entry.",
    }
  })

  return res.status(200).json({
    success: true,
    data: {
      shelters: formattedShelters,
      count: formattedShelters.length,
    },
  })
}
