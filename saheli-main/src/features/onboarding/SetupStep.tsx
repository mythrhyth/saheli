import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useAppState } from "@/app/state/useAppState"
import { ContactChips } from "@/components/ContactChips"
import { Badge, Button, Icon, Segmented, SettingToggle } from "@/components/ui"
import { DEFAULT_ESCALATION, ROLES, STORAGE_KEYS } from "@/config/constants"
import { defaultEmergencyPrefs } from "@/config/defaults"
import { useDiscreetPrefs } from "@/features/sos/useDiscreetTriggers"
import { downloadOfflinePack, formatPackSize } from "@/features/tools/offlinePack"
import { usePersistedState } from "@/hooks/usePersistedState"
import { normalizePhone } from "@/lib/format"
import { contactSchema } from "@/lib/validation"
import type { EmergencyPrefs } from "@/types"
import { SETUP_STEPS } from "./steps"

const [CONTACTS, LOCATION, NOTIFICATIONS, EMERGENCY, DISCREET, OFFLINE] = [0, 1, 2, 3, 4, 5]
const COUNTDOWNS: [number, string][] = [
  [0, "None"],
  [3, "3 s"],
  [5, "5 s"],
  [10, "10 s"],
]
const EMPTY_DRAFT = { name: "", relation: "", phone: "" }

type SetupStepProps = { index: number; onNext: () => void; onSkipAll: () => void }

/** One of the six setup steps. Each step has a primary action; "Later" skips it. */
export function SetupStep({ index, onNext, onSkipAll }: SetupStepProps) {
  const { t } = useTranslation()
  const { contacts, setContacts, requestLocation, requestNotifications } = useAppState()
  const [emergency, setEmergency] = usePersistedState<EmergencyPrefs>(
    STORAGE_KEYS.emergencyPrefs,
    defaultEmergencyPrefs,
  )
  const [discreet, setDiscreet] = useDiscreetPrefs()
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [titleKey, bodyKey, icon] = SETUP_STEPS[index]

  const next = () => {
    setResult(null)
    setErrors({})
    onNext()
  }

  const saveContact = () => {
    const parsed = contactSchema.safeParse({ ...draft, roles: ROLES, escalation: DEFAULT_ESCALATION })
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      return
    }
    if (contacts.some((c) => normalizePhone(c.phone) === normalizePhone(parsed.data.phone))) {
      setErrors({ phone: "This number is already saved" })
      return
    }
    setContacts([...contacts, { id: Date.now(), ...parsed.data }])
    setResult({ text: `Added ${parsed.data.name}`, ok: true })
    setDraft(EMPTY_DRAFT)
    setErrors({})
  }

  const askPermission = async (request: () => Promise<string>) => {
    setBusy(true)
    const status = await request()
    setBusy(false)
    const text =
      status === "granted" ? t("permissionGranted") : status === "unavailable" ? t("unavailable") : t("denied")
    setResult({ text, ok: status === "granted" })
  }

  let content: ReactNode = null
  let primary: { label: string; run: () => void } = { label: t("continue"), run: next }

  switch (index) {
    case CONTACTS: {
      const field = (key: keyof typeof EMPTY_DRAFT, label: string, extra: object = {}) => (
        <>
          <label className="field">
            {label}
            <input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} {...extra} />
          </label>
          {errors[key] && <small className="field-error">{errors[key]}</small>}
        </>
      )
      content = (
        <div className="inline-form">
          {contacts.length > 0 && <ContactChips contacts={contacts} />}
          {field("name", "Name")}
          {field("relation", "Relationship", { placeholder: "Sister, friend, partner…" })}
          {field("phone", "Indian mobile number", { inputMode: "tel", placeholder: "+91 98xxxxxxxx" })}
          {contacts.length > 0 && (
            <Button className="link" onClick={saveContact}>
              + {t("addAnother")}
            </Button>
          )}
        </div>
      )
      if (!contacts.length || draft.name || draft.phone) primary = { label: t("saveContact"), run: saveContact }
      break
    }
    case LOCATION:
      if (!result) primary = { label: busy ? "…" : t("allowLocation"), run: () => void askPermission(requestLocation) }
      break
    case NOTIFICATIONS:
      if (!result)
        primary = { label: busy ? "…" : t("allowNotifications"), run: () => void askPermission(requestNotifications) }
      break
    case EMERGENCY:
      content = (
        <div className="field">
          {t("sosCountdown")}
          <Segmented
            label={t("sosCountdown")}
            options={COUNTDOWNS}
            value={emergency.countdown}
            set={(countdown) => setEmergency({ ...emergency, countdown })}
          />
        </div>
      )
      break
    case DISCREET:
      content = (
        <SettingToggle
          title={t("enableDiscreet")}
          sub={t("discreetHint")}
          value={discreet.enabled}
          set={(enabled) => setDiscreet({ ...discreet, enabled })}
        />
      )
      break
    case OFFLINE:
      primary = result
        ? { label: t("finish"), run: next }
        : {
            label: t("download"),
            run: () =>
              setResult({ text: `${t("done")} · ${formatPackSize(downloadOfflinePack(contacts).size)}`, ok: true }),
          }
      break
  }

  const isPermissionStep = index === LOCATION || index === NOTIFICATIONS

  return (
    <main className="onboarding setup-flow">
      <div className="onboarding-top">
        <Badge>
          {index + 1} / {SETUP_STEPS.length}
        </Badge>
        <Button className="link" onClick={onSkipAll}>
          {t("skipSetup")}
        </Button>
      </div>
      <div className="setup-icon">
        <Icon name={icon} size={34} />
      </div>
      <div>
        <span className="eyebrow">{t("setup")}</span>
        <h1>{t(titleKey)}</h1>
        <p>{t(bodyKey)}</p>
        {content}
        {isPermissionStep && (
          <div className="privacy-note">
            <Icon name="shield" />
            <span>{t("permissionPrivacy")}</span>
          </div>
        )}
        {result && (
          <Badge tone={result.ok ? "ready" : "limited"}>
            <Icon name={result.ok ? "check" : "info"} size={13} />
            {result.text}
          </Badge>
        )}
      </div>
      <div className="flow-actions">
        <Button className="primary" disabled={busy} onClick={primary.run}>
          {primary.label}
        </Button>
        {primary.run !== next && (
          <Button className="secondary full" onClick={next}>
            {t("later")}
          </Button>
        )}
      </div>
    </main>
  )
}
