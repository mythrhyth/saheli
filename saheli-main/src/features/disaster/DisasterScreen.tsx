import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigation, useScreenParams } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ContactChips } from "@/components/ContactChips"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Badge, Button, Icon, PendingNote, Steps } from "@/components/ui"
import { FLOOD_GUIDE, LANDSLIDE_GUIDE } from "@/data/guidance"
import { api } from "@/lib/api"
import { contactNames, contactsWithRole } from "@/lib/contacts"
import { getLocation } from "@/lib/device"
import { formatTime, mapsLink } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"

type CheckInState = "" | "sending" | "safe" | "help"

type DisasterAlertItem = {
  id: number
  title: string
  severity: "info" | "warning" | "danger"
  category: string
  source: string
  area: string
  details: string
  isSample: boolean
}

export default function DisasterScreen() {
  const { t } = useTranslation()
  const { back, open } = useNavigation()
  const { focusCheckin } = useScreenParams()
  const { contacts, profile, dismissAlert } = useAppState()
  const [status, setStatus] = useState<CheckInState>("")
  const [sentAt, setSentAt] = useState(0)
  const [serverAlert, setServerAlert] = useState<DisasterAlertItem | null>(null)
  const checkInRef = useRef<HTMLElement>(null)
  const recipients = contactsWithRole(contacts, "Disaster check-in recipient")

  useEffect(() => {
    let cancelled = false
    api
      .getPublic<{ alerts: DisasterAlertItem[] }>("/alerts?active=true")
      .then((res) => {
        if (!cancelled && res?.alerts && res.alerts.length > 0) {
          setServerAlert(res.alerts[0])
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (focusCheckin) checkInRef.current?.scrollIntoView({ block: "start" })
  }, [focusCheckin])

  const checkIn = async (kind: "safe" | "help") => {
    setStatus("sending")
    const coords = await getLocation()
    const message = kind === "safe" ? "I'm safe." : "I need help."
    queueMessage({
      kind: kind === "safe" ? "disaster-safe" : "disaster-help",
      title: `${kind === "safe" ? "I'm safe" : "I need help"} (heavy rain alert)`,
      body: `${profile.name || "Your contact"} checked in during the heavy rain alert: ${message} ${coords ? mapsLink(coords) : "Location unavailable."}`,
      recipients: contactNames(recipients),
      location: coords,
    })
    setStatus(kind)
    setSentAt(Date.now())
  }

  const sent = status === "safe" || status === "help"

  return (
    <ScreenLayout title={t("guidance")} onBack={back}>
      <div className="alert-banner">
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <Badge tone={serverAlert?.severity === "danger" ? "critical" : "limited"}>
            {serverAlert?.title ? "Active Alert" : t("activeAlert")}
          </Badge>
          {serverAlert?.isSample && <Badge tone="limited">Sample advisory</Badge>}
        </div>
        <h2>{serverAlert?.title ?? t("alert")}</h2>
        <p>
          {serverAlert ? `${serverAlert.area} · ${serverAlert.source} · ${serverAlert.details}` : `${t("alertMeta")} · ${t("sample")}`}
        </p>
      </div>

      {[FLOOD_GUIDE, LANDSLIDE_GUIDE].map((guide) => (
        <div className="guidance" key={guide.title}>
          <strong>{guide.title}</strong>
          <Steps steps={guide.steps} />
        </div>
      ))}

      <section className="setting-block checkin-section" ref={checkInRef}>
        <strong className="block-label">Let your contacts know</strong>
        <ContactChips contacts={recipients} empty="Add a trusted contact to send disaster check-ins." />
        {sent ? (
          <div className={`checkin-result ${status}`}>
            <Icon name={status === "safe" ? "check" : "alert"} />
            <span>
              <strong>{status === "safe" ? '"I\'m safe" queued' : '"I need help" queued'}</strong>
              <small>
                {formatTime(sentAt)} · {recipients.length} contact{recipients.length === 1 ? "" : "s"}
              </small>
            </span>
            <Button className="link" onClick={() => setStatus("")}>
              Change
            </Button>
          </div>
        ) : (
          <div className="dual-actions spaced">
            <Button
              className="safe-action"
              disabled={!recipients.length || status === "sending"}
              onClick={() => void checkIn("safe")}
            >
              {t("safe")}
            </Button>
            <Button
              className="help-action"
              disabled={!recipients.length || status === "sending"}
              onClick={() => void checkIn("help")}
            >
              {t("needHelp")}
            </Button>
          </div>
        )}
        {status === "help" && (
          <PendingNote>
            If you are in danger now, call 112 or 1078. Contacts will see your message once delivery is connected.
          </PendingNote>
        )}
      </section>

      <div className="dual-actions spaced">
        <a className="call-button" href="tel:112">
          <Icon name="phone" />
          {t("call112")}
        </a>
        <a className="call-button" href="tel:1078">
          <Icon name="phone" />
          Call 1078
        </a>
      </div>
      <Button className="secondary full spaced" onClick={() => open("shelter")}>
        <Icon name="home" />
        Find a shelter
      </Button>
      <Button
        className="link center-link"
        onClick={() => {
          dismissAlert()
          back()
        }}
      >
        Dismiss this alert
      </Button>
    </ScreenLayout>
  )
}
