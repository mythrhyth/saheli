import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { Badge, Button } from "@/components/ui"
import { getAreaInfo } from "@/data/areas"
import { saveRouteDraft } from "@/features/journeys/routeDraft"
import { api } from "@/lib/api"

type AreaSheetProps = { area: string; time: string; layers: string[]; onClose: () => void }

type AreaInsight = {
  area: string
  isSampleData: boolean
  safetyStatus: string
  overallTone: "supported" | "caution" | "limited" | "unknown"
  confidence: "High" | "Moderate" | "Limited" | "None"
  freshness: {
    lastUpdated: string | null
    ageHours: number | null
    isStale: boolean
  }
  signals: {
    lighting: { description: string; value: number | null }
    transport: { description: string; value: number | null }
    publicPlaces: { description: string; value: number | null }
    communityReports: { description: string; value: number }
    hazard: { active: boolean; details: string | null }
  }
  missingSignals: string[]
  explanation: string[]
  disclaimer: string
  safetyDisclaimer?: string
}

const EVIDENCE_LAYERS = ["Lighting", "Crowd estimate", "Community reports", "Hazards"]

/** Bottom sheet with evidence for the selected area. Only enabled layers are shown. */
export function AreaSheet({ area, time, layers, onClose }: AreaSheetProps) {
  const { t } = useTranslation()
  const { open } = useNavigation()
  const fallbackInfo = getAreaInfo(area)
  const [insight, setInsight] = useState<AreaInsight | null>(null)

  useEffect(() => {
    let cancelled = false

    api
      .getPublic<AreaInsight>(`/areas/${encodeURIComponent(area)}/insights`)
      .then((data) => {
        if (!cancelled) setInsight(data)
      })
      .catch(() => {
        // Safe fallback to local data if backend is offline
        if (!cancelled) setInsight(null)
      })

    return () => {
      cancelled = true
    }
  }, [area])

  const has = (layer: string) => layers.includes(layer)
  const tone = insight ? insight.overallTone : fallbackInfo.tone
  const statusLabel = insight ? insight.safetyStatus : tone === "supported" ? "More information" : tone === "caution" ? "Caution" : t("limited")

  return (
    <section className="area-sheet">
      <div className="sheet-handle" />
      <div className="sheet-title">
        <div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
            <Badge tone={tone === "supported" ? "ready" : "limited"}>
              {statusLabel}
            </Badge>
            {insight?.isSampleData && <Badge tone="limited">Sample fixture</Badge>}
            {insight && (
              <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>
                {insight.confidence} confidence
              </span>
            )}
          </div>
          <h2>{area}</h2>
          {insight?.freshness.isStale && (
            <small style={{ color: "var(--warning)", display: "block", marginTop: 2 }}>
              Notice: Signals have not been updated recently.
            </small>
          )}
        </div>
        <Button className="close" onClick={onClose}>
          {t("close")}
        </Button>
      </div>

      <div className="evidence-grid">
        {has("Lighting") && (
          <div>
            <span>Lighting coverage</span>
            <strong>
              {insight?.signals.lighting.description ?? fallbackInfo.coverage}
            </strong>
          </div>
        )}
        {has("Crowd estimate") && (
          <div>
            <span>Crowd activity · {time}</span>
            <strong>{fallbackInfo.crowd[time]} · Estimate</strong>
          </div>
        )}
        {has("Community reports") && (
          <div>
            <span>Community reports</span>
            <strong>
              {insight
                ? insight.signals.communityReports.description
                : fallbackInfo.reports}
            </strong>
          </div>
        )}
        {has("Hazards") && (
          <div>
            <span>Hazards</span>
            <strong className={insight?.signals.hazard.active || !fallbackInfo.hazard.startsWith("None") ? "warning" : ""}>
              {insight?.signals.hazard.details ?? fallbackInfo.hazard}
            </strong>
          </div>
        )}
        {!EVIDENCE_LAYERS.some(has) && (
          <div>
            <span>No layers selected</span>
            <strong>Turn on a layer above</strong>
          </div>
        )}
      </div>

      {insight?.explanation && insight.explanation.length > 0 && (
        <div style={{ margin: "10px 0", fontSize: 11, color: "var(--text-subtle)", background: "var(--surface-2)", padding: 8, borderRadius: 8 }}>
          <strong style={{ display: "block", marginBottom: 3 }}>Explainable factors:</strong>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {insight.explanation.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="fineprint">
        {insight?.safetyDisclaimer ?? `Crowded does not mean safe. ${t("noGuarantee")}`}
      </p>
      <div className="dual-actions">
        <Button className="secondary" onClick={() => open("report", { area })}>
          {t("report")}
        </Button>
        <Button
          className="primary"
          onClick={() => {
            saveRouteDraft({ from: t("current"), destination: area })
            open("route")
          }}
        >
          {t("routeHere")}
        </Button>
      </div>
      <Button className="link center-link" onClick={() => open("assessment")}>
        Why this assessment?
      </Button>
    </section>
  )
}
