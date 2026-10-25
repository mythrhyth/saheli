/** SAMPLE DATA: route options and evidence. Replace with a routing + evidence API. */

export type RouteOption = {
  name: string
  km: number
  transport: string
  lighting: string
  crowd: string
  places: string
  reports: string
  warning: string
  updated: string
  evidence: string
}

export const ROUTES: RouteOption[] = [
  {
    name: "Route A",
    km: 4.2,
    transport: "Bus available",
    lighting: "Partial lighting",
    crowd: "Moderate · Estimate",
    places: "4 open places",
    reports: "1 report · 3 days ago",
    warning: "Crosses active rain alert",
    updated: "Updated 18 min ago",
    evidence: "More supporting information",
  },
  {
    name: "Route B",
    km: 3.8,
    transport: "Transport Unknown",
    lighting: "More lighting coverage",
    crowd: "Low · Estimate",
    places: "2 open places",
    reports: "No recent reports",
    warning: "No closure confirmed",
    updated: "Updated 1 hour ago",
    evidence: "Limited information",
  },
  {
    name: "Route C",
    km: 5.1,
    transport: "Taxi / auto estimate",
    lighting: "Unknown lighting",
    crowd: "Unknown",
    places: "3 open places",
    reports: "2 reports · 1 week ago",
    warning: "Avoid low-lying stretch",
    updated: "Updated yesterday",
    evidence: "Limited information",
  },
]

export type EvidenceItem = { name: string; source: string; status: string; time: string; limit: string }

export const ASSESSMENT_EVIDENCE: EvidenceItem[] = [
  {
    name: "Street lighting",
    source: "Third-party",
    status: "Partial coverage",
    time: "Updated 2 hours ago",
    limit: "Coverage is unavailable on two stretches.",
  },
  {
    name: "Crowd activity",
    source: "Estimate",
    status: "Moderate estimate",
    time: "Updated 18 min ago",
    limit: "Crowded does not mean safe; quiet and crowded places carry different considerations.",
  },
  {
    name: "Heavy rain warning",
    source: "Official",
    status: "Active · IMD",
    time: "Issued 18 min ago",
    limit: "Road passability is not confirmed.",
  },
  {
    name: "Community concern",
    source: "Community-submitted",
    status: "Harassment reported",
    time: "3 days ago",
    limit: "Unverified report; details may be incomplete.",
  },
  {
    name: "Transport",
    source: "Third-party",
    status: "Last bus 9:30 PM",
    time: "Updated today",
    limit: "Live vehicle positions are unavailable.",
  },
]
