import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Button, Segmented } from "@/components/ui"
import { ROUTES } from "@/data/routes"

type RouteCompareViewProps = {
  chosen: number | null
  minutesFor: (km: number, extra?: number) => number
  onChoose: (index: number) => void
  onBack: () => void
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
  const night = departure === "Night"

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
      <Segmented label="Departure" options={DEPARTURES} value={departure} set={setDeparture} />
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
      <p className="fineprint">
        Crowded does not mean safe. Comparison supports your decision. No route is guaranteed safe.
      </p>
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
