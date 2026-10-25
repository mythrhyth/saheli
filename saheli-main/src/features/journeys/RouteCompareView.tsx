import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Badge, Button, Segmented } from "@/components/ui"
import { ROUTES } from "@/data/routes"
import { api } from "@/lib/api"
import { readRouteDraft } from "./routeDraft"

type RouteCompareViewProps = {
  chosen: number | null
  minutesFor: (km: number, extra?: number) => number
  onChoose: (index: number) => void
  onBack: () => void
}

type BackendCompareResponse = {
  status: "compared" | "insufficient_data"
  isSampleData: boolean
  message?: string
  safetyDisclaimer?: string
  tradeOffAnalysis?: string
  routes?: Array<{
    name: string
    description: string
    travelMetrics: {
      distanceKm: number
      estimatedMinutes: number
      mode: string
    }
    safetyEvidence: {
      tone: string
      lighting: { status: string; detail: string }
      transport: { status: string; verified: boolean }
      publicPlaces: { count: number; detail: string }
      recentReports: { count: number; detail: string }
      hazards: { active: boolean; warning: string }
    }
    tradeOffSummary: string
  }>
}

const DEPARTURES: [string, string][] = [
  ["Now", "Now"],
  ["Evening", "Evening"],
  ["Night", "Night"],
]

/** Side-by-side comparison of Route A and Route B. */
export function RouteCompareView({ chosen, minutesFor, onChoose, onBack }: RouteCompareViewProps) {
  const { t } = useTranslation()
  const [departure, setDeparture] = useState("Now")
  const [compareData, setCompareData] = useState<BackendCompareResponse | null>(null)
  const draft = readRouteDraft(t("current"))
  const night = departure === "Night"

  useEffect(() => {
    let cancelled = false

    const origin = draft.from && draft.from !== "Current location" ? draft.from : "Police Bazaar"
    const destination = draft.destination ? draft.destination : "Laitumkhrah"
    const timeOfDay = departure === "Now" ? "Evening" : departure

    api
      .post<BackendCompareResponse>("/routes/compare", {
        origin,
        destination,
        mode: "Walk",
        timeOfDay,
      })
      .then((res) => {
        if (!cancelled) setCompareData(res)
      })
      .catch(() => {
        if (!cancelled) setCompareData(null)
      })

    return () => {
      cancelled = true
    }
  }, [departure, draft.from, draft.destination])

  const rows = [
    ["Time", `${minutesFor(ROUTES[0].km, night ? 2 : 0)} min`, `${minutesFor(ROUTES[1].km, night ? 3 : 0)} min`],
    ["Distance", "4.2 km", "3.8 km"],
    ["Transport", night ? "Last bus 9:30 PM" : "Bus + walk", "Unknown"],
    ["Lighting", "Partial", "More coverage"],
    ["Crowd estimate", night ? "Low · Estimate" : "Moderate · Estimate", "Low · Estimate"],
    ["Open places", night ? "2" : "4", "2"],
    ["Reports", "1 · 3 days ago", "None reported"],
    ["Official warning", "Rain flag", "Rain flag"],
    ["Evidence", "More supporting info", "Limited"],
  ]

  return (
    <ScreenLayout title={t("compareRoutes")} onBack={onBack}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Segmented label="Departure" options={DEPARTURES} value={departure} set={setDeparture} />
        {compareData?.isSampleData && <Badge tone="limited">Sample routes</Badge>}
      </div>

      {compareData?.status === "insufficient_data" ? (
        <div style={{ padding: 16, background: "var(--surface-2)", borderRadius: 12, margin: "16px 0", border: "1px solid var(--border)" }}>
          <strong style={{ display: "block", color: "var(--warning)", marginBottom: 6 }}>
            ⚠️ Insufficient Evidence Available
          </strong>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
            {compareData.message}
          </p>
        </div>
      ) : (
        <>
          <div className="comparison-table">
            <div className="comparison-row header">
              <b>Evidence</b>
              <b>Route A</b>
              <b>Route B</b>
            </div>
            {rows.map((row) => (
              <div className="comparison-row" key={row[0]}>
                {row.map((cell, i) => (
                  <span key={i}>{cell}</span>
                ))}
              </div>
            ))}
          </div>

          {compareData?.tradeOffAnalysis && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--surface-2)", borderRadius: 10, fontSize: 12, lineHeight: 1.5 }}>
              <strong>Trade-off analysis:</strong> {compareData.tradeOffAnalysis}
            </div>
          )}

          <p className="fineprint">
            {compareData?.safetyDisclaimer ??
              "Crowded does not mean safe. Comparison supports your decision. No route is guaranteed safe."}
          </p>
        </>
      )}

      <div className="dual-actions">
        {[0, 1].map((index) => (
          <Button key={index} className={chosen === index ? "primary" : "secondary"} onClick={() => onChoose(index)}>
            Choose {index === 0 ? "A" : "B"}
          </Button>
        ))}
      </div>
    </ScreenLayout>
  )
}
