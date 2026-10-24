import type { Request, Response } from "express"
import { z } from "zod"

const compareRoutesSchema = z.object({
  origin: z.string().trim().min(2, "Origin is required").max(100),
  destination: z.string().trim().min(2, "Destination is required").max(100),
  mode: z.enum(["Walk", "Bus", "Taxi", "Auto"]).default("Walk"),
  timeOfDay: z.enum(["Morning", "Afternoon", "Evening", "Night"]).default("Evening"),
})

const TRANSPORT_SPEEDS: Record<string, number> = {
  Walk: 4.8,
  Bus: 18,
  Taxi: 24,
  Auto: 20,
}

// Seeded Shillong Demonstration Routes (from frontend routes.ts)
const SHILLONG_DEMO_ROUTES = [
  {
    name: "Route A",
    description: "Main road via GS Road and Polo Ground",
    distanceKm: 4.2,
    transport: {
      status: "Bus available",
      verified: true,
      options: ["City Bus 4A", "Shared Taxi"],
    },
    lighting: {
      status: "Partial lighting",
      coverageScore: 0.65,
      detail: "Major streetlights active along 70% of stretch",
    },
    publicPlaces: {
      count: 4,
      detail: "4 open places (2 pharmacies, 1 fuel station, 1 hospital entrance)",
    },
    recentReports: {
      count: 1,
      detail: "1 unverified community concern reported 3 days ago",
    },
    hazards: {
      active: true,
      warning: "Crosses active IMD rain advisory zone",
    },
    tone: "caution" as const,
    tradeOff:
      "Has more open public places and documented lighting, but is 0.4 km longer and crosses an active rain alert zone.",
  },
  {
    name: "Route B",
    description: "Shortest route through residential link road",
    distanceKm: 3.8,
    transport: {
      status: "Transport Unknown",
      verified: false,
      options: [],
    },
    lighting: {
      status: "More lighting coverage",
      coverageScore: 0.8,
      detail: "Good streetlamp density reported by residents",
    },
    publicPlaces: {
      count: 2,
      detail: "2 open corner stores identified",
    },
    recentReports: {
      count: 0,
      detail: "No recent reports in the last 7 days",
    },
    hazards: {
      active: false,
      warning: "No road closures confirmed",
    },
    tone: "supported" as const,
    tradeOff: "Shortest route with good lighting reports, but public transit availability is unverified.",
  },
  {
    name: "Route C",
    description: "Alternate bypass via valley road",
    distanceKm: 5.1,
    transport: {
      status: "Taxi / auto estimate",
      verified: false,
      options: ["Occasional private taxi"],
    },
    lighting: {
      status: "Unknown lighting",
      coverageScore: null,
      detail: "No lighting audit recorded for this bypass",
    },
    publicPlaces: {
      count: 3,
      detail: "3 open places noted during daytime; evening hours unverified",
    },
    recentReports: {
      count: 2,
      detail: "2 reports regarding low visibility from 1 week ago",
    },
    hazards: {
      active: true,
      warning: "Avoid low-lying underpass during rainfall",
    },
    tone: "limited" as const,
    tradeOff: "Longest route (5.1 km) with unverified lighting and a low-lying stretch prone to waterlogging.",
  },
]

export function compareRoutes(req: Request, res: Response) {
  const result = compareRoutesSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0]?.message || "Invalid route comparison input",
      },
    })
  }

  const { origin, destination, mode, timeOfDay } = result.data
  const speed = TRANSPORT_SPEEDS[mode] || 4.8

  // Check if query matches known Shillong corridor
  const isKnownDemoCorridor =
    (origin.toLowerCase().includes("police") || origin.toLowerCase().includes("shillong")) ||
    (destination.toLowerCase().includes("laitumkhrah") || destination.toLowerCase().includes("polo")) ||
    (origin.toLowerCase().includes("bazaar") || destination.toLowerCase().includes("bazaar"))

  if (!isKnownDemoCorridor) {
    // Zero-hallucination guarantee: Do NOT fake route data for unmapped routes
    return res.status(200).json({
      success: true,
      data: {
        origin,
        destination,
        mode,
        timeOfDay,
        status: "insufficient_data",
        isSampleData: false,
        message:
          "Routing geometry and verified evidence are currently unavailable for this corridor. Saheli does not fabricate route paths or travel times.",
        availableRoutes: [],
      },
    })
  }

  // Calculate comparative routes
  const evaluatedRoutes = SHILLONG_DEMO_ROUTES.map((route) => {
    const estimatedMinutes = Math.round((route.distanceKm / speed) * 60)

    return {
      name: route.name,
      description: route.description,
      isSampleData: true,
      // Clear separation of travel metrics from safety evidence
      travelMetrics: {
        distanceKm: route.distanceKm,
        mode,
        estimatedMinutes,
        speedKmh: speed,
      },
      safetyEvidence: {
        tone: route.tone,
        lighting: route.lighting,
        transport: route.transport,
        publicPlaces: route.publicPlaces,
        recentReports: route.recentReports,
        hazards: route.hazards,
      },
      tradeOffSummary: route.tradeOff,
    }
  })

  return res.status(200).json({
    success: true,
    data: {
      origin,
      destination,
      mode,
      timeOfDay,
      status: "compared",
      isSampleData: true,
      safetyDisclaimer:
        "Routes are evaluated comparatively on available recorded evidence. No route can be guaranteed as completely safe. Stay vigilant, stick to well-lit areas, and consider starting a check-in.",
      tradeOffAnalysis:
        timeOfDay === "Night"
          ? "At night, Route B has better lighting reports and Route A has more open public places. Route C has unverified lighting and should be avoided."
          : "During daylight hours, all routes have comparable visibility. Route B is the shortest option.",
      routes: evaluatedRoutes,
    },
  })
}
