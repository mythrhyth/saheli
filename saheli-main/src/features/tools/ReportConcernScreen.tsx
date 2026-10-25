import { useState } from "react"
import { useNavigation, useScreenParams } from "@/app/navigation/useNavigation"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Button, Icon, Segmented, SettingToggle } from "@/components/ui"
import { STORAGE_KEYS } from "@/config/constants"
import { AREAS, REPORT_CATEGORIES } from "@/data/areas"
import { usePersistedState } from "@/hooks/usePersistedState"
import { formatDate } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import type { Report } from "@/types"

const MIN_DETAIL = 10
const MAX_DETAIL = 500
const WHEN_OPTIONS: [string, string][] = [
  ["Just now", "Just now"],
  ["Earlier today", "Earlier today"],
  ["Before today", "Before today"],
]

export default function ReportConcernScreen() {
  const { back } = useNavigation()
  const params = useScreenParams()
  const [reports, setReports] = usePersistedState<Report[]>(STORAGE_KEYS.reports, [])
  const [category, setCategory] = useState("")
  const [area, setArea] = useState(params.area ?? "Current location")
  const [when, setWhen] = useState("Just now")
  const [detail, setDetail] = useState("")
  const [anonymous, setAnonymous] = useState(true)
  const [errors, setErrors] = useState<{ category?: boolean; detail?: boolean }>({})
  const [submitted, setSubmitted] = useState(false)

  const submit = () => {
    const nextErrors = { category: !category, detail: detail.trim().length < MIN_DETAIL }
    setErrors(nextErrors)
    if (nextErrors.category || nextErrors.detail) return

    const report: Report = { id: Date.now(), category, area, when, detail: detail.trim(), anonymous, at: Date.now() }
    setReports([report, ...reports])
    queueMessage({
      kind: "report",
      title: `Community report: ${category}`,
      body: `${area} · ${when} · ${report.detail}`,
      recipients: ["Moderation queue"],
    })
    setSubmitted(true)
    setCategory("")
    setDetail("")
  }

  const remove = (id: number) => {
    if (confirm("Delete this report?")) setReports(reports.filter((r) => r.id !== id))
  }

  return (
    <ScreenLayout title="Report a concern" onBack={back}>
      {submitted ? (
        <div className="feature-hero">
          <span className="setup-icon">
            <Icon name="check" size={32} />
          </span>
          <h2>Thank you for reporting</h2>
          <p>
            Your report is saved and queued for review. Once published it will be shown as{" "}
            <b>community-submitted · unverified</b>
            {anonymous ? ", without your name" : ""}.
          </p>
          <div className="dual-actions">
            <Button className="secondary" onClick={() => setSubmitted(false)}>
              Report another
            </Button>
            <Button className="primary" onClick={back}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="info-banner">
            <Icon name="alert" size={16} />
            <span>
              In immediate danger? <a href="tel:112">Call 112</a>. Reports are not monitored in real time.
            </span>
          </div>

          <section className="setting-block">
            <strong className="block-label">What happened?</strong>
            <div className="chip-wrap">
              {REPORT_CATEGORIES.map((c) => (
                <Button
                  key={c}
                  className={`select-chip ${category === c ? "active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
            {errors.category && <small className="field-error">Choose a category.</small>}
          </section>

          <label className="field">
            Where?
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              {["Current location", ...AREAS].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>

          <div className="field">
            When?
            <Segmented label="When" options={WHEN_OPTIONS} value={when} set={setWhen} />
          </div>

          <label className="field">
            Details
            <textarea
              rows={4}
              value={detail}
              maxLength={MAX_DETAIL}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Describe what you saw. Don't include names or phone numbers."
            />
            <small className="char-count">
              {detail.length}/{MAX_DETAIL}
            </small>
          </label>
          {errors.detail && <small className="field-error">Write at least {MIN_DETAIL} characters.</small>}

          <SettingToggle
            title="Report anonymously"
            sub="Your name and contact details are never shown"
            value={anonymous}
            set={setAnonymous}
          />
          <Button className="primary" onClick={submit}>
            Submit report
          </Button>
        </>
      )}

      {reports.length > 0 && (
        <>
          <div className="section-heading">
            <h2>Your reports</h2>
            <span>{reports.length}</span>
          </div>
          {reports.map((r) => (
            <div className="list-row" key={r.id}>
              <span className="list-icon">
                <Icon name="alert" />
              </span>
              <span>
                <strong>
                  {r.category} · {r.area}
                </strong>
                <small>
                  {formatDate(r.at)} · Pending review · {r.anonymous ? "Anonymous" : "Named"}
                </small>
              </span>
              <Button className="danger-link" onClick={() => remove(r.id)}>
                Delete
              </Button>
            </div>
          ))}
        </>
      )}
    </ScreenLayout>
  )
}
