import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { Button, Icon } from "@/components/ui"
import { AREAS } from "@/data/areas"
import { saveRouteDraft, splitRoute } from "@/features/journeys/routeDraft"

const SUGGESTED_DESTINATIONS = ["Laitumkhrah", "Police Bazaar"]
const MAX_RECENT = 3

/** "Where are you going?" card on Home. */
export function RoutePlannerCard() {
  const { t } = useTranslation()
  const { open } = useNavigation()
  const { history } = useAppState()
  const [from, setFrom] = useState(t("current"))
  const [to, setTo] = useState("")
  const [error, setError] = useState(false)

  const recent = [...new Set(history.map((j) => splitRoute(j.route).destination).filter(Boolean))].slice(0, MAX_RECENT)
  const chips = recent.length ? recent : SUGGESTED_DESTINATIONS

  const plan = (destination = to) => {
    if (!destination.trim()) {
      setError(true)
      return
    }
    saveRouteDraft({ from: from.trim() || t("current"), destination: destination.trim() })
    open("route")
  }

  return (
    <section className="plan-card">
      <div className="section-title">
        <div>
          <span className="eyebrow">{t("plan")}</span>
          <h2>{t("where")}</h2>
        </div>
        <Icon name="route" />
      </div>
      <label className="route-input">
        <span className="dot current" />
        <span>
          <small>{t("from")}</small>
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t("current")} />
        </span>
      </label>
      <label className={`route-input ${error ? "invalid" : ""}`}>
        <span className="dot destination" />
        <span>
          <small>{t("to")}</small>
          <input
            value={to}
            list="area-list"
            placeholder={t("searchDestination")}
            onChange={(e) => {
              setTo(e.target.value)
              setError(false)
            }}
            onKeyDown={(e) => e.key === "Enter" && plan()}
          />
        </span>
        <Icon name="search" />
      </label>
      <datalist id="area-list">
        {AREAS.map((area) => (
          <option key={area} value={area} />
        ))}
      </datalist>
      {error && <small className="field-error">{t("enterDestination")}</small>}
      <div className="recent-chips">
        <span>{recent.length ? t("recent") : t("suggested")}</span>
        {chips.map((place) => (
          <Button
            key={place}
            onClick={() => {
              setTo(place)
              plan(place)
            }}
          >
            {place}
          </Button>
        ))}
      </div>
      <Button className="primary" onClick={() => plan()}>
        {t("plan")}
        <Icon name="chevron" />
      </Button>
    </section>
  )
}
