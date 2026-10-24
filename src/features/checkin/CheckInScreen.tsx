import { useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ContactChips } from "@/components/ContactChips"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Badge, Button, Icon, PendingNote, Toast } from "@/components/ui"
import { STORAGE_KEYS } from "@/config/constants"
import { defaultJourneyDefaults } from "@/config/defaults"
import { useNow } from "@/hooks/useNow"
import { usePersistedState } from "@/hooks/usePersistedState"
import { useToast } from "@/hooks/useToast"
import { api } from "@/lib/api"
import { contactNames, contactsWithRole } from "@/lib/contacts"
import { clock, formatTime } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import type { JourneyDefaults } from "@/types"
import { graceEndsAt, startCheckIn } from "./checkin"
import { useCheckIn } from "./useCheckIn"

const INTERVALS = [5, 10, 15, 30, 45, 60]

export default function CheckInScreen() {
  const { back, goTab } = useNavigation()
  const { contacts, profile } = useAppState()
  const [defaults] = usePersistedState<JourneyDefaults>(STORAGE_KEYS.journeyDefaults, defaultJourneyDefaults)
  const [checkIn, setCheckIn] = useCheckIn()
  const [minutes, setMinutes] = useState(defaults.interval)
  const [label, setLabel] = useState("Walking home")
  const [toast, showToast] = useToast()
  const now = useNow()
  const recipients = contactsWithRole(contacts, "Journey viewer")

  const end = (notifySafe: boolean) => {
    if (notifySafe) {
      queueMessage({
        kind: "checkin-safe",
        title: "I'm safe",
        body: `${profile.name || "Your contact"} checked in: I'm safe. ${formatTime(Date.now())}.`,
        recipients: contactNames(recipients),
      })
      if (checkIn && api.getToken()) {
        api.patch(`/checkins/${checkIn.id}/safe`).catch(() => {})
      }
    } else if (checkIn && api.getToken()) {
      api.del(`/checkins/${checkIn.id}`).catch(() => {})
    }
    setCheckIn(null)
    showToast(notifySafe ? 'Check-in ended. An "I\'m safe" message was queued.' : "Check-in ended.")
  }

  if (!checkIn) {
    return (
      <ScreenLayout title="Check-in" onBack={back}>
        <Toast text={toast} />
        <p className="lead">
          Set a timer. If you don't tap <b>I'm safe</b> before it ends, plus a {defaults.grace}-minute grace period,
          your contacts are alerted with your last known location.
        </p>
        <section className="setting-block">
          <strong className="block-label">Check in every</strong>
          <div className="duration-grid three">
            {INTERVALS.map((m) => (
              <Button key={m} className={minutes === m ? "active" : ""} onClick={() => setMinutes(m)}>
                {m} min
              </Button>
            ))}
          </div>
        </section>
        <label className="field">
          What are you doing?
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
            placeholder="e.g. Walking home"
          />
        </label>
        <section className="setting-block">
          <strong className="block-label">If you miss it, we alert</strong>
          <ContactChips
            contacts={recipients}
            empty="Add a trusted contact first so someone can be alerted."
            onManage={() => goTab("contacts")}
          />
        </section>
        <Button
          className="primary"
          disabled={!recipients.length}
          onClick={async () => {
            const nextCheckIn = startCheckIn(minutes, defaults.grace, label.trim() || "Check-in")
            showToast("Check-in started.")
            if (api.getToken()) {
              try {
                const res = await api.post<{ checkIn: { id: number } }>("/checkins", {
                  label: nextCheckIn.label,
                  intervalMinutes: minutes,
                  graceMinutes: defaults.grace,
                })
                if (res?.checkIn?.id) {
                  setCheckIn({ ...nextCheckIn, id: res.checkIn.id })
                }
              } catch {
                // Keep local state
              }
            }
          }}
        >
          <Icon name="clock" />
          Start {minutes}-minute check-in
        </Button>
      </ScreenLayout>
    )
  }

  const remaining = (checkIn.dueAt - now) / 1000
  const graceLeft = (graceEndsAt(checkIn) - now) / 1000
  const progress = checkIn.status === "running" ? Math.max(0, Math.min(1, remaining / (checkIn.interval * 60))) : 0
  const statusLabel =
    checkIn.status === "running" ? "On track" : checkIn.status === "missed" ? "Check-in missed" : "Escalated"

  const imSafe = () => {
    if (checkIn.status === "escalated") return end(true)
    if (api.getToken()) {
      api.patch(`/checkins/${checkIn.id}/safe`).catch(() => {})
    }
    startCheckIn(checkIn.interval, checkIn.grace, checkIn.label)
    showToast(`Thanks. Next check-in in ${checkIn.interval} min.`)
  }

  return (
    <ScreenLayout title="Check-in" onBack={back}>
      <Toast text={toast} />
      <div className="countdown-block">
        <div
          className={`countdown-ring ${checkIn.status === "running" ? "" : "critical"}`}
          style={{ ["--pct" as string]: progress }}
        >
          <strong>
            {checkIn.status === "running" ? clock(remaining) : checkIn.status === "missed" ? clock(graceLeft) : "!"}
          </strong>
          <small>
            {checkIn.status === "running"
              ? `due ${formatTime(checkIn.dueAt)}`
              : checkIn.status === "missed"
                ? "until contacts are alerted"
                : "contacts alerted"}
          </small>
        </div>
        <Badge tone={checkIn.status === "running" ? "ready" : "critical"}>
          {checkIn.label} · {statusLabel}
        </Badge>
      </div>

      {checkIn.status === "escalated" && (
        <PendingNote>
          A missed check-in alert was queued for {recipients.length} contact{recipients.length === 1 ? "" : "s"}. Let
          them know you're okay.
        </PendingNote>
      )}

      <Button className="safe-action full" onClick={imSafe}>
        <Icon name="check" />
        {checkIn.status === "escalated" ? "I'm safe now" : "I'm safe, restart timer"}
      </Button>

      {checkIn.status !== "escalated" && (
        <div className="dual-actions spaced">
          <Button
            className="secondary"
            onClick={() => {
              if (api.getToken()) {
                api.patch(`/checkins/${checkIn.id}/extend`, { extraMinutes: 10 }).catch(() => {})
              }
              setCheckIn({ ...checkIn, dueAt: Math.max(checkIn.dueAt, Date.now()) + 10 * 60000, status: "running" })
              showToast("Added 10 minutes.")
            }}
          >
            +10 min
          </Button>
          <Button className="secondary" onClick={() => end(true)}>
            I've arrived
          </Button>
        </div>
      )}

      <Button className="link center-link" onClick={() => end(false)}>
        Stop without notifying anyone
      </Button>

      <section className="setting-block">
        <strong className="block-label">Contacts on this check-in</strong>
        <ContactChips contacts={recipients} empty="No contacts." />
      </section>
    </ScreenLayout>
  )
}
