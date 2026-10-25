import { useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { AccordionItem, Button, Icon, Steps, Toast } from "@/components/ui"
import { STORAGE_KEYS } from "@/config/constants"
import { DIGITAL_GUIDES, SECURITY_CHECKLIST } from "@/data/guidance"
import { usePersistedState } from "@/hooks/usePersistedState"
import { useToast } from "@/hooks/useToast"
import type { EvidenceEntry } from "@/types"

type Tab = "guide" | "checklist" | "evidence"
const EMPTY_FORM = { platform: "", when: "", detail: "", link: "" }

export default function DigitalSafetyScreen() {
  const { back } = useNavigation()
  const [tab, setTab] = useState<Tab>("guide")
  const [done, setDone] = usePersistedState<string[]>(STORAGE_KEYS.securityChecklist, [])
  const [log, setLog] = usePersistedState<EvidenceEntry[]>(STORAGE_KEYS.evidenceLog, [])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState("")
  const [toast, showToast] = useToast()

  const tabs: [Tab, string][] = [
    ["guide", "Guides"],
    ["checklist", `Checklist ${done.length}/${SECURITY_CHECKLIST.length}`],
    ["evidence", `Evidence log${log.length ? ` (${log.length})` : ""}`],
  ]

  const toggleItem = (item: string) => setDone(done.includes(item) ? done.filter((x) => x !== item) : [...done, item])

  const addEntry = () => {
    if (!form.platform.trim() || form.detail.trim().length < 5) {
      setError("Add the platform and a short description.")
      return
    }
    setLog([{ id: Date.now(), ...form }, ...log])
    setForm(EMPTY_FORM)
    setError("")
    showToast("Evidence entry saved on this device.")
  }

  const copyLog = async () => {
    const text = log
      .map((e) => `${e.when || "Date not set"} | ${e.platform} | ${e.detail}${e.link ? ` | ${e.link}` : ""}`)
      .join("\n")
    try {
      await navigator.clipboard.writeText(text)
      showToast("Evidence log copied. Paste it into your report.")
    } catch {
      showToast("Couldn't copy. Select the text manually.")
    }
  }

  return (
    <ScreenLayout title="Digital Safety" onBack={back}>
      <Toast text={toast} />
      <div className="preview-tabs" role="tablist">
        {tabs.map(([key, label]) => (
          <Button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
      </div>

      {tab === "guide" && (
        <>
          {DIGITAL_GUIDES.map((guide) => (
            <AccordionItem key={guide.title} title={guide.title} subtitle={`${guide.steps.length} steps`}>
              <Steps steps={guide.steps} />
            </AccordionItem>
          ))}
          <div className="dual-actions spaced">
            <a className="emergency-button" href="tel:1930">
              <Icon name="phone" />
              Call 1930
            </a>
            <a className="secondary" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">
              cybercrime.gov.in
            </a>
          </div>
          <p className="fineprint">
            Saheli does not file reports for you. These are general guidance steps, not legal advice.
          </p>
        </>
      )}

      {tab === "checklist" && (
        <section>
          <div className="progress-bar slim">
            <i style={{ width: `${(done.length / SECURITY_CHECKLIST.length) * 100}%` }} />
          </div>
          {SECURITY_CHECKLIST.map((item) => (
            <label className="check-row checklist-row" key={item}>
              <input type="checkbox" checked={done.includes(item)} onChange={() => toggleItem(item)} />
              <span>{item}</span>
            </label>
          ))}
        </section>
      )}

      {tab === "evidence" && (
        <>
          <section className="form-card">
            <label className="field">
              Platform
              <input
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                placeholder="Instagram, WhatsApp, SMS…"
              />
            </label>
            <label className="field">
              When did it happen?
              <input
                type="datetime-local"
                value={form.when}
                onChange={(e) => setForm({ ...form, when: e.target.value })}
              />
            </label>
            <label className="field">
              What happened?
              <textarea
                rows={3}
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                placeholder="Describe the message or incident"
              />
            </label>
            <label className="field">
              Link (optional)
              <input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://"
              />
            </label>
            {error && <small className="field-error">{error}</small>}
            <Button className="primary" onClick={addEntry}>
              Save entry
            </Button>
          </section>

          {log.length > 0 && (
            <>
              <div className="section-heading">
                <h2>Saved entries</h2>
                <Button className="link" onClick={() => void copyLog()}>
                  Copy all
                </Button>
              </div>
              {log.map((entry) => (
                <div className="list-row" key={entry.id}>
                  <span className="list-icon">
                    <Icon name="file" />
                  </span>
                  <span>
                    <strong>{entry.platform}</strong>
                    <small>
                      {entry.when ? new Date(entry.when).toLocaleString() : "Date not set"} · {entry.detail}
                    </small>
                  </span>
                  <Button className="danger-link" onClick={() => setLog(log.filter((x) => x.id !== entry.id))}>
                    Delete
                  </Button>
                </div>
              ))}
            </>
          )}
          <p className="fineprint">Evidence is stored only on this device. Keep original screenshots too.</p>
        </>
      )}
    </ScreenLayout>
  )
}
