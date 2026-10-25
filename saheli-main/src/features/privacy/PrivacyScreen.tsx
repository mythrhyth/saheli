import { useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ScreenHeader } from "@/components/layout/ScreenLayout"
import { Button } from "@/components/ui"
import { RETENTION_OPTIONS, STORAGE_KEYS } from "@/config/constants"
import { formatDate } from "@/lib/format"
import { writeJSON } from "@/lib/storage"
import { isSharingActive } from "@/features/sharing/sharing"
import { exportLocalData } from "./exportData"
import { applyRetention, getRetention } from "./retention"

export default function PrivacyScreen() {
  const { back } = useNavigation()
  const { contacts, session, setSession, history, setHistory, locationStatus } = useAppState()
  const [retention, setRetention] = useState(getRetention)
  const [showHelp, setShowHelp] = useState(false)
  const active = isSharingActive(session)

  const revoke = (id: number) => {
    if (!session) return
    const ids = session.contactIds.filter((x) => x !== id)
    setSession(ids.length ? { ...session, contactIds: ids } : { ...session, status: "ended" })
  }

  const changeRetention = (value: string) => {
    setRetention(value)
    writeJSON(STORAGE_KEYS.retention, value)
    setHistory(applyRetention(history, value))
  }

  const notificationPermission = typeof Notification === "undefined" ? "Unavailable" : Notification.permission

  return (
    <main className="screen-content feature-page">
      <ScreenHeader title="Privacy dashboard" eyebrow="SAHELI" onBack={back} />

      <section className="privacy-card">
        <div>
          <span className="eyebrow">SHARING STATUS</span>
          <h2>
            {active
              ? `${session.status === "paused" ? "Paused" : "Active"} sharing session`
              : "Your location isn't being shared"}
          </h2>
          <p>Every sharing action is explicit and revocable.</p>
        </div>
      </section>

      {active && (
        <section className="setting-block">
          <div className="section-heading">
            <h2>People with access</h2>
            <Button
              className="danger-link"
              onClick={() => confirm("Stop all active sharing?") && setSession({ ...session, status: "ended" })}
            >
              Stop all
            </Button>
          </div>
          {session.contactIds.map((id) => {
            const contact = contacts.find((c) => c.id === id)
            if (!contact) return null
            return (
              <div className="list-row" key={id}>
                <span>
                  <strong>{contact.name}</strong>
                  <small>Location only · {session.status}</small>
                </span>
                <Button className="danger-link" onClick={() => revoke(id)}>
                  Revoke
                </Button>
              </div>
            )
          })}
        </section>
      )}

      <section className="setting-block">
        <h2>Data retention</h2>
        <select value={retention} onChange={(e) => changeRetention(e.target.value)}>
          {RETENTION_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <p className="info-note">Journeys older than the selected period are deleted automatically.</p>
      </section>

      <section className="setting-block">
        <div className="section-heading">
          <h2>Journey history</h2>
          {history.length > 0 && (
            <Button className="danger-link" onClick={() => confirm("Clear all journey history?") && setHistory([])}>
              Clear all
            </Button>
          )}
        </div>
        {history.length ? (
          history.map((journey) => (
            <div className="list-row" key={journey.id}>
              <span>
                <strong>{journey.route}</strong>
                <small>{journey.endedAt ? formatDate(journey.endedAt) : journey.date}</small>
              </span>
              <Button className="danger-link" onClick={() => setHistory(history.filter((x) => x.id !== journey.id))}>
                Delete
              </Button>
            </div>
          ))
        ) : (
          <p className="muted">No saved journeys.</p>
        )}
      </section>

      <section className="setting-block">
        <h2>Browser permissions</h2>
        <div className="permission-row">
          <span>Location</span>
          <span className={`status-pill ${locationStatus}`}>{locationStatus}</span>
        </div>
        <div className="permission-row">
          <span>Notifications</span>
          <span className="status-pill">{notificationPermission}</span>
        </div>
        <Button className="secondary full" onClick={() => setShowHelp(!showHelp)}>
          How to change browser permissions
        </Button>
        {showHelp && (
          <p className="info-note">
            Use the lock or settings icon beside this site's address, choose Site settings, then update Location or
            Notifications. Reload the app afterward.
          </p>
        )}
      </section>

      <section className="setting-block">
        <h2>Your data</h2>
        <p className="muted left">Everything Saheli stores is kept on this device. Download a copy at any time.</p>
        <Button className="secondary full" onClick={exportLocalData}>
          Download my data (JSON)
        </Button>
      </section>
    </main>
  )
}
