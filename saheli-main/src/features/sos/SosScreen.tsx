import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ContactChips } from "@/components/ContactChips"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Button, Icon, PendingNote } from "@/components/ui"
import { STORAGE_KEYS } from "@/config/constants"
import { defaultEmergencyPrefs } from "@/config/defaults"
import { usePersistedState } from "@/hooks/usePersistedState"
import { api } from "@/lib/api"
import { contactNames, contactsStrictlyWithRole } from "@/lib/contacts"
import { getLocation, vibrate } from "@/lib/device"
import { formatTime, mapsLink } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import type { Coords, EmergencyPrefs } from "@/types"

type Phase = "confirm" | "countdown" | "sending" | "sent" | "resolved"

export default function SosScreen() {
  const { back, goTab } = useNavigation()
  const { contacts, profile } = useAppState()
  const [prefs] = usePersistedState<EmergencyPrefs>(STORAGE_KEYS.emergencyPrefs, defaultEmergencyPrefs)
  const [phase, setPhase] = useState<Phase>("confirm")
  const [secondsLeft, setSecondsLeft] = useState(prefs.countdown)
  const [location, setLocation] = useState<Coords | null>(null)
  const [updates, setUpdates] = useState(0)

  const recipients = useMemo(() => contactsStrictlyWithRole(contacts, "SOS recipient"), [contacts])
  const sender = profile.name || "Your contact"

  const send = useCallback(async () => {
    setPhase("sending")
    vibrate(400)
    const coords = prefs.includeLocation ? await getLocation() : null
    setLocation(coords)
    queueMessage({
      kind: "sos",
      title: "SOS alert",
      body: `${sender}: ${prefs.message} ${coords ? mapsLink(coords) : "Location unavailable."} Call 112 if there is immediate danger.`,
      recipients: contactNames(recipients),
      location: coords,
    })
    if (api.getToken()) {
      try {
        await api.post("/sos", {
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          message: prefs.message,
        })
      } catch {
        // Safe mock fallback
      }
    }
    setPhase("sent")
  }, [prefs.includeLocation, prefs.message, sender, recipients])

  // Countdown before sending.
  useEffect(() => {
    if (phase !== "countdown") return
    if (secondsLeft <= 0) {
      void send()
      return
    }
    const id = setTimeout(() => {
      setSecondsLeft(secondsLeft - 1)
      vibrate(60)
    }, 1000)
    return () => clearTimeout(id)
  }, [phase, secondsLeft, send])

  // Repeat location updates while the alert is active.
  useEffect(() => {
    if (phase !== "sent" || !prefs.repeatMins) return
    const id = setInterval(async () => {
      const coords = await getLocation()
      queueMessage({
        kind: "sos",
        title: "SOS location update",
        body: `${sender}: location update. ${coords ? mapsLink(coords) : "Location unavailable."}`,
        recipients: contactNames(recipients),
        location: coords,
      })
      setUpdates((n) => n + 1)
    }, prefs.repeatMins * 60000)
    return () => clearInterval(id)
    // Recipients are captured when the alert is sent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prefs.repeatMins])

  const start = () => {
    if (prefs.countdown > 0) {
      setSecondsLeft(prefs.countdown)
      setPhase("countdown")
    } else void send()
  }

  const resolve = () => {
    queueMessage({
      kind: "sos-cancel",
      title: "I'm safe now",
      body: `${sender} is safe now and has cancelled the SOS alert.`,
      recipients: contactNames(recipients),
    })
    if (api.getToken()) {
      api.post("/sos/cancel").catch(() => {})
    }
    setPhase("resolved")
  }

  return (
    <ScreenLayout title="SOS" onBack={back}>
      {phase === "confirm" && (
        <>
          <div className="emergency-symbol">
            <Icon name="alert" size={36} />
          </div>
          <h2 className="center">Send SOS alert?</h2>
          <p className="center muted">
            Your trusted contacts receive your message{prefs.includeLocation ? " and last known location" : ""}
            {prefs.countdown ? ` after a ${prefs.countdown}-second countdown you can cancel` : ""}.
          </p>
          <section className="setting-block">
            <strong className="block-label">Will alert</strong>
            <ContactChips
              contacts={recipients}
              empty="No SOS recipients yet. You can still call 112."
              onManage={() => goTab("contacts")}
            />
          </section>
          <Button className="emergency-button big" onClick={start} disabled={!recipients.length}>
            Send SOS now
          </Button>
        </>
      )}

      {phase === "countdown" && (
        <div className="countdown-block">
          <div className="countdown-ring critical">
            <strong>{secondsLeft}</strong>
            <small>seconds</small>
          </div>
          <h2 className="center">Sending SOS…</h2>
          <p className="center muted">Tap cancel if this was a mistake.</p>
          <Button className="secondary full" onClick={() => setPhase("confirm")}>
            Cancel
          </Button>
          <Button className="emergency-button" onClick={() => setSecondsLeft(0)}>
            Send immediately
          </Button>
        </div>
      )}

      {phase === "sending" && (
        <div className="countdown-block">
          <div className="countdown-ring critical">
            <span className="spinner" />
          </div>
          <h2 className="center">Getting your location…</h2>
        </div>
      )}

      {phase === "sent" && (
        <>
          <div className="emergency-symbol sent">
            <Icon name="check" size={36} />
          </div>
          <h2 className="center">SOS alert recorded</h2>
          <p className="center muted">
            For {recipients.length} contact{recipients.length === 1 ? "" : "s"} · {formatTime(Date.now())}
            {location ? ` · location ±${location.accuracy} m` : " · location unavailable"}
            {updates ? ` · ${updates} location update${updates === 1 ? "" : "s"}` : ""}
          </p>
          <PendingNote>
            SIMULATED DEMO ALERT: Logged to backend mock dispatcher. In this demo mode, real carrier SMS and 112
            calls are not dispatched. If you are in real danger, call 112 immediately.
          </PendingNote>
          {prefs.repeatMins > 0 && (
            <p className="center muted small-note">
              Location updates are queued every {prefs.repeatMins} min while this screen is open.
            </p>
          )}
          <Button className="safe-action full" onClick={resolve}>
            <Icon name="check" />
            I'm safe now
          </Button>
        </>
      )}

      {phase === "resolved" && (
        <div className="feature-hero">
          <span className="setup-icon">
            <Icon name="check" size={32} />
          </span>
          <h2>Glad you're safe</h2>
          <p>An "I'm safe" follow-up was queued for your contacts.</p>
          <Button className="primary" onClick={back}>
            Done
          </Button>
        </div>
      )}

      {(prefs.showCall112 || phase !== "confirm") && (
        <a className="call-button" href="tel:112">
          <Icon name="phone" />
          Call 112
        </a>
      )}
    </ScreenLayout>
  )
}
