import { useEffect, useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { HelplineRow } from "@/components/HelplineRow"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { AccordionItem, Button, Icon, Steps } from "@/components/ui"
import { STORAGE_KEYS } from "@/config/constants"
import { SAFETY_GUIDANCE } from "@/data/guidance"
import { HELPLINES } from "@/data/helplines"
import { SHELTERS } from "@/data/shelters"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { usePersistedState } from "@/hooks/usePersistedState"
import { formatDate, telHref } from "@/lib/format"
import { removeKey } from "@/lib/storage"
import type { OfflinePackMeta } from "@/types"
import { downloadOfflinePack, formatPackSize, type OfflineContent } from "./offlinePack"

const PROGRESS_STEP = 20
const PROGRESS_TICK_MS = 180

export default function OfflineScreen() {
  const { back } = useNavigation()
  const { contacts } = useAppState()
  const [pack, setPack] = usePersistedState<OfflinePackMeta | null>(STORAGE_KEYS.offlinePack, null)
  const [content] = usePersistedState<OfflineContent | null>(STORAGE_KEYS.offlineContent, null)
  const [progress, setProgress] = useState(-1)
  const online = useOnlineStatus()

  // Animated "download"; the pack is written when progress reaches 100%.
  useEffect(() => {
    if (progress < 0 || progress >= 100) return
    const id = setTimeout(() => {
      const next = Math.min(100, progress + PROGRESS_STEP)
      setProgress(next)
      if (next === 100) {
        downloadOfflinePack(contacts)
        setTimeout(() => setProgress(-1), 600)
      }
    }, PROGRESS_TICK_MS)
    return () => clearTimeout(id)
  }, [progress, contacts])

  const removePack = () => {
    removeKey(STORAGE_KEYS.offlineContent)
    setPack(null)
  }

  const savedContacts = content?.contacts ?? contacts

  return (
    <ScreenLayout title="Offline tools" onBack={back}>
      <section className="status-card">
        <span className={`status-dot ${online ? "on" : "off"}`} />
        <span>
          <strong>{online ? "You're online" : "You're offline"}</strong>
          <small>
            {pack
              ? `Offline pack saved ${formatDate(pack.savedAt)} · ${formatPackSize(pack.size)}`
              : "No offline pack on this device yet"}
          </small>
        </span>
      </section>

      {progress >= 0 ? (
        <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${progress}%` }} />
          <span>{progress < 100 ? `Saving essentials… ${progress}%` : "Saved"}</span>
        </div>
      ) : (
        <div className="dual-actions spaced">
          <Button className="primary" onClick={() => setProgress(0)}>
            <Icon name="download" />
            {pack ? "Update pack" : "Download pack"}
          </Button>
          {pack && (
            <Button className="secondary" onClick={removePack}>
              <Icon name="trash" />
              Remove
            </Button>
          )}
        </div>
      )}
      <p className="fineprint">
        The pack contains emergency numbers, safety guidance, a shelter snapshot and your trusted contacts. It stays on
        this device.
      </p>

      <div className="section-heading">
        <h2>Emergency numbers</h2>
        <span>Works without internet</span>
      </div>
      {HELPLINES.slice(0, 5).map((h) => (
        <HelplineRow key={h.number} {...h} />
      ))}

      <div className="section-heading">
        <h2>Safety guidance</h2>
      </div>
      {SAFETY_GUIDANCE.map((guide) => (
        <AccordionItem key={guide.title} title={guide.title} subtitle={`${guide.steps.length} steps`}>
          <Steps steps={guide.steps} />
        </AccordionItem>
      ))}

      <div className="section-heading">
        <h2>Trusted contacts</h2>
        <span>{pack ? "From offline pack" : "Live"}</span>
      </div>
      {savedContacts.length ? (
        savedContacts.map((c) => (
          <div className="helpline-row" key={c.phone + c.name}>
            <span className="avatar small">{c.name.slice(0, 1)}</span>
            <span>
              <strong>{c.name}</strong>
              <small>
                {c.relation} · {c.phone}
              </small>
            </span>
            <a className="call-chip" href={telHref(c.phone)}>
              <Icon name="phone" size={16} />
              Call
            </a>
          </div>
        ))
      ) : (
        <p className="muted left">No trusted contacts saved.</p>
      )}

      <div className="section-heading">
        <h2>Shelters snapshot</h2>
        <span>Sample data</span>
      </div>
      {SHELTERS.slice(0, 3).map((s) => (
        <div className="list-row" key={s.id}>
          <span className="list-icon">
            <Icon name="home" />
          </span>
          <span>
            <strong>{s.name}</strong>
            <small>
              {s.area} · {s.distance} km · {s.status}
            </small>
          </span>
        </div>
      ))}
    </ScreenLayout>
  )
}
