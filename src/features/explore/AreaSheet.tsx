import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { Badge, Button } from "@/components/ui"
import { getAreaInfo } from "@/data/areas"
import { saveRouteDraft } from "@/features/journeys/routeDraft"

type AreaSheetProps = { area: string; time: string; layers: string[]; onClose: () => void }

const EVIDENCE_LAYERS = ["Lighting", "Crowd estimate", "Community reports", "Hazards"]

/** Bottom sheet with evidence for the selected area. Only enabled layers are shown. */
export function AreaSheet({ area, time, layers, onClose }: AreaSheetProps) {
  const { t } = useTranslation()
  const { open } = useNavigation()
  const info = getAreaInfo(area)
  const has = (layer: string) => layers.includes(layer)
  const toneLabel = info.tone === "supported" ? "More information" : info.tone === "caution" ? "Caution" : t("limited")

  return (
    <section className="area-sheet">
      <div className="sheet-handle" />
      <div className="sheet-title">
        <div>
          <Badge tone={info.tone === "supported" ? "ready" : "limited"}>{toneLabel}</Badge>
          <h2>{area}</h2>
        </div>
        <Button className="close" onClick={onClose}>
          {t("close")}
        </Button>
      </div>

      <div className="evidence-grid">
        {has("Lighting") && (
          <div>
            <span>Lighting coverage</span>
            <strong>{info.coverage}</strong>
          </div>
        )}
        {has("Crowd estimate") && (
          <div>
            <span>Crowd activity · {time}</span>
            <strong>{info.crowd[time]} · Estimate</strong>
          </div>
        )}
        {has("Community reports") && (
          <div>
            <span>Community reports</span>
            <strong>{info.reports}</strong>
          </div>
        )}
        {has("Hazards") && (
          <div>
            <span>Hazards</span>
            <strong className={info.hazard.startsWith("None") ? "" : "warning"}>{info.hazard}</strong>
          </div>
        )}
        {!EVIDENCE_LAYERS.some(has) && (
          <div>
            <span>No layers selected</span>
            <strong>Turn on a layer above</strong>
          </div>
        )}
      </div>

      <p className="fineprint">Crowded does not mean safe. {t("noGuarantee")}</p>
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
