import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { MapPreview } from "@/components/MapPreview"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Badge, Button, Icon } from "@/components/ui"
import { STORAGE_KEYS, TRANSPORT_SPEEDS } from "@/config/constants"
import { defaultJourneyDefaults } from "@/config/defaults"
import { ROUTES, type RouteOption } from "@/data/routes"
import { usePersistedState } from "@/hooks/usePersistedState"
import type { JourneyDefaults } from "@/types"
import { AssessmentView } from "./AssessmentScreen"
import { RouteCompareView } from "./RouteCompareView"
import { readRouteDraft } from "./routeDraft"

type View = "list" | "compare" | "evidence"

const routeFacts = (r: RouteOption) => [r.transport, r.lighting, r.crowd, r.places, r.reports, r.warning, r.updated]
const WARNING_FACT_INDEX = 5

export default function RoutePlanningScreen() {
  const { t } = useTranslation()
  const { back, goTab } = useNavigation()
  const { startJourney } = useAppState()
  const [defaults] = usePersistedState<JourneyDefaults>(STORAGE_KEYS.journeyDefaults, defaultJourneyDefaults)
  const [view, setView] = useState<View>("list")
  const [mode, setMode] = useState(defaults.mode in TRANSPORT_SPEEDS ? defaults.mode : "Walk")
  const [chosen, setChosen] = useState<number | null>(null)
  const draft = readRouteDraft(t("current"))

  const minutesFor = (km: number, extra = 0) => Math.round((km / TRANSPORT_SPEEDS[mode]) * 60) + extra

  const start = async () => {
    if (chosen === null) return
    await startJourney(ROUTES[chosen].name, mode)
    goTab("journeys")
  }

  if (view === "evidence") return <AssessmentView onBack={() => setView("list")} />
  if (view === "compare")
    return (
      <RouteCompareView
        chosen={chosen}
        minutesFor={minutesFor}
        onBack={() => setView("list")}
        onChoose={(index) => {
          setChosen(index)
          setView("list")
        }}
      />
    )

  return (
    <ScreenLayout title={t("routePlanning")} onBack={back}>
      <div className="route-summary">
        <span>
          <small>{t("from")}</small>
          <strong>{draft.from}</strong>
        </span>
        <Icon name="chevron" />
        <span>
          <small>{t("to")}</small>
          <strong>{draft.destination || t("searchDestination")}</strong>
        </span>
      </div>

      <div className="transport-chips" role="radiogroup" aria-label="Transport">
        {Object.keys(TRANSPORT_SPEEDS).map((m) => (
          <Button className={mode === m ? "active" : ""} key={m} onClick={() => setMode(m)}>
            {m}
          </Button>
        ))}
      </div>
      <MapPreview large />

      {ROUTES.map((route, i) => (
        <section className={`route-card-full ${chosen === i ? "chosen" : ""}`} key={route.name}>
          <div className="sheet-title">
            <div>
              <Badge tone={chosen === i ? "selected" : ""}>{route.name}</Badge>
              <h2>
                {minutesFor(route.km)} min · {route.km} km
              </h2>
            </div>
            <Badge>{route.evidence}</Badge>
          </div>
          <div className="route-facts">
            {routeFacts(route).map((fact, n) => (
              <span
                key={fact}
                className={fact.includes("Unknown") ? "unknown" : n === WARNING_FACT_INDEX ? "warning" : ""}
              >
                {fact}
              </span>
            ))}
          </div>
          <p className="fineprint">Crowded does not mean safe.</p>
          <div className="route-actions">
            <Button onClick={() => setView("evidence")}>Why this assessment?</Button>
            <Button onClick={() => setView("compare")}>Compare side by side</Button>
            <Button className="choose" onClick={() => setChosen(chosen === i ? null : i)}>
              {chosen === i ? (
                <>
                  <Icon name="check" size={14} />
                  Chosen
                </>
              ) : (
                t("chooseRoute")
              )}
            </Button>
          </div>
        </section>
      ))}
      <p className="fineprint">{t("noGuarantee")}</p>

      {chosen !== null && (
        <div className="sticky-action">
          <Button className="primary" disabled={!draft.destination} onClick={() => void start()}>
            <Icon name="route" />
            {t("startJourney")} · {ROUTES[chosen].name}
          </Button>
        </div>
      )}
    </ScreenLayout>
  )
}
