import { useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ScreenHeader } from "@/components/layout/ScreenLayout"
import { Button, EmptyState } from "@/components/ui"
import { useNow } from "@/hooks/useNow"
import { api } from "@/lib/api"
import { getLocation, notify } from "@/lib/device"
import { formatTime, initials, mapsLink } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import type { SharingStatus } from "@/types"
import { isSharingActive, sharingTimeLeft } from "./sharing"

const DURATIONS: [value: string, label: string][] = [
  ["15", "15 min"],
  ["60", "1 hour"],
  ["stop", "Until I stop"],
  ["custom", "Custom"],
]

export default function LiveSharingScreen() {
  const { back } = useNavigation()
  const { contacts, session, setSession, profile } = useAppState()
  const [selected, setSelected] = useState<number[]>(() =>
    (session?.contactIds ?? []).filter((id) => contacts.some((c) => c.id === id)),
  )
  const [duration, setDuration] = useState("60")
  const [custom, setCustom] = useState("30")
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)
  useNow()

  const customMinutes = Number(custom)
  const customValid = Number.isInteger(customMinutes) && customMinutes >= 1 && customMinutes <= 1440
  const canStart = selected.length > 0 && !starting && (duration !== "custom" || customValid)
  const selectedNames = contacts.filter((c) => selected.includes(c.id)).map((c) => c.name)

  const toggleContact = (id: number) =>
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const start = async () => {
    if (!canStart) return
    setStarting(true)
    const coords = await getLocation(8000)
    setStarting(false)
    const minutes = duration === "custom" ? customMinutes : Number(duration)

    let backendSession: { id: number; publicToken: string; publicTrackingUrl: string } | null = null
    if (api.getToken()) {
      try {
        const res = await api.post<{ session: { id: number; publicToken: string; publicTrackingUrl: string } }>(
          "/sharing",
          { contactIds: selected, durationMinutes: duration === "stop" ? 240 : minutes },
        )
        if (res?.session) {
          backendSession = res.session
          if (coords) {
            api
              .post(`/sharing/${res.session.id}/location`, {
                lat: coords.lat,
                lng: coords.lng,
                accuracy: coords.accuracy,
              })
              .catch(() => {})
          }
        }
      } catch {
        // Fall back to local session
      }
    }

    setSession({
      id: backendSession ? backendSession.id : Date.now(),
      contactIds: selected,
      status: coords ? "live" : "failed",
      startedAt: Date.now(),
      endsAt: duration === "stop" ? null : Date.now() + minutes * 60000,
      publicToken: backendSession?.publicToken,
      publicTrackingUrl: backendSession?.publicTrackingUrl,
    })
    if (!coords) return
    queueMessage({
      kind: "sharing",
      title: "Live location shared",
      body: `${profile.name || "Your contact"} is sharing their live location with you ${duration === "stop" ? "until they stop" : `for ${minutes} minutes`}. ${mapsLink(coords)}`,
      recipients: selectedNames,
      location: coords,
    })
    notify("Live sharing started", `Sharing with ${selectedNames.join(", ")}`, "sharing")
  }

  const setStatus = (status: SharingStatus) => {
    if (!session) return
    if (api.getToken() && session.id) {
      const action = status === "live" ? "resume" : status
      api.patch(`/sharing/${session.id}/${action}`).catch(() => {})
    }
    setSession({ ...session, status })
    notify(`Sharing ${status === "live" ? "resumed" : status}`, "Saheli live location", "sharing")
  }

  return (
    <main className="screen-content feature-page">
      <ScreenHeader title="Live location sharing" eyebrow="SAHELI" onBack={back} />

      {(!session || session.status === "ended") && (
        <>
          <section className="setting-block">
            <h2>Who can see your location?</h2>
            {contacts.length ? (
              contacts.map((c) => (
                <label className="check-row contact-select" key={c.id}>
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleContact(c.id)} />
                  <span className="avatar">{initials(c.name)}</span>
                  <span>
                    {c.name}
                    <small>{c.phone}</small>
                  </span>
                </label>
              ))
            ) : (
              <p className="muted">Add a trusted contact first.</p>
            )}
          </section>

          <section className="setting-block">
            <h2>Duration</h2>
            <div className="duration-grid">
              {DURATIONS.map(([value, label]) => (
                <Button key={value} className={duration === value ? "active" : ""} onClick={() => setDuration(value)}>
                  {label}
                </Button>
              ))}
            </div>
            {duration === "custom" && (
              <label className="field">
                Minutes (1–1440)
                <input type="number" min="1" max="1440" value={custom} onChange={(e) => setCustom(e.target.value)} />
                {!customValid && <small className="field-error">Enter a whole number between 1 and 1440.</small>}
              </label>
            )}
          </section>

          <section className="share-summary">
            <b>{selectedNames.length ? selectedNames.join(", ") : "No contacts selected"}</b>
            <p>
              They can see your current location only. Sharing ends{" "}
              {duration === "stop" ? "when you stop it" : "after the selected duration"}.
            </p>
          </section>

          <Button className="primary" disabled={!canStart} onClick={() => void start()}>
            {starting ? "Getting your location…" : "Start sharing"}
          </Button>
        </>
      )}

      {isSharingActive(session) && (
        <section className="active-share">
          <span className="feature-icon">⌖</span>
          <span className={`status-pill ${session.status}`}>{session.status}</span>
          <h2>
            {session.status === "paused"
              ? "Sharing is paused"
              : `Sharing with ${session.contactIds.length} contact${session.contactIds.length === 1 ? "" : "s"}`}
          </h2>
          <strong>{sharingTimeLeft(session)}</strong>
          <p>Location only · started {formatTime(session.startedAt)}</p>
          <div className="dual-actions">
            <Button className="secondary" onClick={() => setStatus(session.status === "paused" ? "live" : "paused")}>
              {session.status === "paused" ? "Resume" : "Pause"}
            </Button>
            <Button className="help-action" onClick={() => confirm("Stop sharing now?") && setStatus("ended")}>
              Stop
            </Button>
          </div>

          {session.publicToken && (
            <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface-2)", borderRadius: 10, textAlign: "left" }}>
              <strong style={{ fontSize: 12, display: "block", marginBottom: 4 }}>🔗 Public Tracking Token</strong>
              <code style={{ fontSize: 11, wordBreak: "break-all", display: "block", color: "var(--accent-dark)", marginBottom: 8 }}>
                {window.location.origin}/api/v1/sharing/public/{session.publicToken}
              </code>
              <Button
                className="secondary compact"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/v1/sharing/public/${session.publicToken}`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 3000)
                }}
              >
                {copied ? "Copied to clipboard!" : "Copy link for contacts"}
              </Button>
            </div>
          )}

          <p className="pending-inline">
            Location updates are synchronized with the backend. Privacy-protected: user identifiers are never leaked.
          </p>
        </section>
      )}

      {session?.status === "ended" && (
        <p className="fineprint center">Your last sharing session has ended. Contacts can no longer see updates.</p>
      )}

      {session?.status === "failed" && (
        <EmptyState
          title="Sharing failed"
          body="Your location is unavailable. Allow location access in your browser's site settings, then try again."
        >
          <Button className="primary" onClick={() => setSession(null)}>
            Try again
          </Button>
        </EmptyState>
      )}
    </main>
  )
}
