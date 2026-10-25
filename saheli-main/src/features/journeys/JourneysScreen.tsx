import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { MapPreview } from "@/components/MapPreview"
import { Badge, Button, EmptyState, Icon, Toast } from "@/components/ui"
import { startCheckIn } from "@/features/checkin/checkin"
import { useCheckIn } from "@/features/checkin/useCheckIn"
import { SharingChip } from "@/features/sharing/SharingChip"
import { useNow } from "@/hooks/useNow"
import { useToast } from "@/hooks/useToast"
import { contactNames, contactsWithRole } from "@/lib/contacts"
import { clock, formatDate, formatTime } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import { saveRouteDraft, splitRoute } from "./routeDraft"

const HISTORY_LIMIT = 10

/** Journeys tab: the active journey (if any) and recent history. */
export default function JourneysScreen() {
  const { t } = useTranslation()
  const { open, goTab } = useNavigation()
  const { journey, endJourney, history, session, contacts, profile } = useAppState()
  const [checkIn] = useCheckIn()
  const [toast, showToast] = useToast(4000)
  const now = useNow()

  const markSafe = () => {
    if (checkIn && checkIn.status !== "escalated") {
      startCheckIn(checkIn.interval, checkIn.grace, checkIn.label)
      showToast(`Checked in. Next check-in in ${checkIn.interval} min.`)
      return
    }
    queueMessage({
      kind: "checkin-safe",
      title: "I'm safe",
      body: `${profile.name || "Your contact"} checked in: I'm safe. ${formatTime(Date.now())}.`,
      recipients: contactNames(contactsWithRole(contacts, "Journey viewer")),
    })
    showToast('"I\'m safe" queued for your journey viewers.')
  }

  const planAgain = (route: string) => {
    saveRouteDraft(splitRoute(route))
    open("route")
  }

  const nextCheckIn = !checkIn
    ? "Off"
    : checkIn.status === "running"
      ? clock((checkIn.dueAt - now) / 1000)
      : checkIn.status === "missed"
        ? "Missed"
        : "Alerted"

  return (
    <main className="screen-content">
      <header className="simple-header">
        <span className="eyebrow">{t("journeys")}</span>
        <h1>{t("yourJourneys")}</h1>
        <p>{t("noGuarantee")}</p>
      </header>
      <Toast text={toast} />
      <SharingChip />

      {journey ? (
        <section className="active-journey">
          <Badge tone="ready">
            <span className="pulse" />
            {t("journeyInProgress")}
          </Badge>
          <MapPreview />
          <h2>
            {journey.from} → {journey.to}
          </h2>
          <div className="journey-stats">
            <div>
              <strong>{clock((now - journey.startedAt) / 1000)}</strong>
              <span>Elapsed</span>
            </div>
            <div>
              <strong>{journey.route}</strong>
              <span>{journey.mode}</span>
            </div>
            <div>
              <strong>{nextCheckIn}</strong>
              <span>Next check-in</span>
            </div>
          </div>
          <div className="dual-actions">
            <Button className="primary" onClick={markSafe}>
              <Icon name="check" />
              {t("safe")}
            </Button>
            <Button className="secondary" onClick={() => open("share")}>
              {session?.status === "live" ? t("manageSharing") : t("share")}
            </Button>
          </div>
          <Button className="secondary full spaced" onClick={() => confirm(t("endJourneyConfirm")) && endJourney()}>
            {t("endJourney")}
          </Button>
        </section>
      ) : (
        <EmptyState icon={<Icon name="route" size={26} />} title={t("noJourney")} body={t("noJourneyBody")}>
          <div className="dual-actions spaced">
            <Button className="secondary" onClick={() => open("checkin")}>
              {t("checkin")}
            </Button>
            <Button className="primary" onClick={() => goTab("home")}>
              {t("plan")}
            </Button>
          </div>
        </EmptyState>
      )}

      <div className="section-heading">
        <h2>{t("history")}</h2>
        <Button className="link" onClick={() => open("privacy")}>
          {t("manage")}
        </Button>
      </div>
      {history.length ? (
        history.slice(0, HISTORY_LIMIT).map((j) => (
          <div className="list-row" key={j.id}>
            <span className="list-icon">
              <Icon name="route" />
            </span>
            <span>
              <strong>{j.route}</strong>
              <small>{j.endedAt ? formatDate(j.endedAt) : j.date}</small>
            </span>
            <Button className="link" onClick={() => planAgain(j.route)}>
              {t("planAgain")}
            </Button>
          </div>
        ))
      ) : (
        <p className="muted left">{t("noHistory")}</p>
      )}
    </main>
  )
}
