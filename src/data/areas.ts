/** SAMPLE DATA for Shillong. Replace with `GET /areas/:name/insights` once the backend exists. */

export const AREAS = [
  "Police Bazaar",
  "Laitumkhrah",
  "Polo",
  "Ward's Lake",
  "Malki",
  "Lachumiere",
  "Mawlai",
  "Nongthymmai",
]

export const TIMES_OF_DAY = ["Morning", "Afternoon", "Evening", "Night"]

export const MAP_LAYERS = ["Lighting", "Transport", "Public places", "Crowd estimate", "Community reports", "Hazards"]

export type AreaInfo = {
  tone: "limited" | "caution" | "supported"
  coverage: string
  crowd: Record<string, string>
  reports: string
  hazard: string
}

const AREA_INFO: Record<string, AreaInfo> = {
  "Police Bazaar": {
    tone: "caution",
    coverage: "Partial · updated 24 min ago",
    crowd: { Morning: "Moderate", Afternoon: "High", Evening: "Moderate", Night: "Low" },
    reports: "1 recent · Unverified",
    hazard: "Heavy rain · IMD",
  },
  Laitumkhrah: {
    tone: "limited",
    coverage: "Limited · updated 3 h ago",
    crowd: { Morning: "Moderate", Afternoon: "Moderate", Evening: "Moderate", Night: "Low" },
    reports: "None reported",
    hazard: "Heavy rain · IMD",
  },
  Polo: {
    tone: "supported",
    coverage: "Good · updated 1 h ago",
    crowd: { Morning: "Low", Afternoon: "Moderate", Evening: "High", Night: "Low" },
    reports: "None reported",
    hazard: "None active",
  },
}

const UNKNOWN_AREA: AreaInfo = {
  tone: "limited",
  coverage: "Unknown · no recent data",
  crowd: { Morning: "Unknown", Afternoon: "Unknown", Evening: "Unknown", Night: "Unknown" },
  reports: "No data",
  hazard: "Heavy rain · IMD (district)",
}

export function getAreaInfo(name: string): AreaInfo {
  return AREA_INFO[name] ?? UNKNOWN_AREA
}

export const REPORT_CATEGORIES = [
  "Harassment",
  "Stalking",
  "Poor lighting",
  "Isolated area",
  "Unsafe transport",
  "Road / flood hazard",
  "Other",
]
