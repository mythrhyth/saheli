import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ContactChips } from "@/components/ContactChips"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Button, Segmented, SettingToggle } from "@/components/ui"
import { STORAGE_KEYS } from "@/config/constants"
import { defaultEmergencyPrefs } from "@/config/defaults"
import { usePersistedState } from "@/hooks/usePersistedState"
import { contactsStrictlyWithRole } from "@/lib/contacts"
import type { EmergencyPrefs } from "@/types"

const MAX_MESSAGE = 160
const COUNTDOWNS: [number, string][] = [
  [0, "None"],
  [3, "3 s"],
  [5, "5 s"],
  [10, "10 s"],
]
const REPEATS: [number, string][] = [
  [0, "Off"],
  [2, "2 min"],
  [5, "5 min"],
  [10, "10 min"],
]

export default function EmergencyPrefsScreen() {
  const { back, goTab } = useNavigation()
  const { contacts, profile } = useAppState()
  const [prefs, setPrefs] = usePersistedState<EmergencyPrefs>(STORAGE_KEYS.emergencyPrefs, defaultEmergencyPrefs)
  const sosRecipients = contactsStrictlyWithRole(contacts, "SOS recipient")

  return (
    <ScreenLayout title="Emergency preferences" onBack={back}>
      <section className="setting-block">
        <strong className="block-label">SOS recipients</strong>
        <ContactChips
          contacts={sosRecipients}
          empty="No one has the SOS recipient role yet."
          onManage={() => goTab("contacts")}
        />
      </section>

      <section className="setting-block">
        <strong className="block-label">Countdown before sending</strong>
        <p className="muted left">Gives you a moment to cancel an accidental SOS.</p>
        <Segmented
          label="Countdown"
          options={COUNTDOWNS}
          value={prefs.countdown}
          set={(countdown) => setPrefs({ ...prefs, countdown })}
        />
      </section>

      <SettingToggle
        title="Include my location"
        sub="Attach last known location to SOS alerts"
        value={prefs.includeLocation}
        set={(includeLocation) => setPrefs({ ...prefs, includeLocation })}
      />

      <section className="setting-block">
        <strong className="block-label">Repeat location updates</strong>
        <Segmented
          label="Repeat location"
          options={REPEATS}
          value={prefs.repeatMins}
          set={(repeatMins) => setPrefs({ ...prefs, repeatMins })}
        />
      </section>

      <SettingToggle
        title="Show Call 112 on SOS screen"
        value={prefs.showCall112}
        set={(showCall112) => setPrefs({ ...prefs, showCall112 })}
      />

      <label className="field">
        SOS message
        <textarea
          rows={3}
          maxLength={MAX_MESSAGE}
          value={prefs.message}
          onChange={(e) => setPrefs({ ...prefs, message: e.target.value })}
        />
        <small className="char-count">
          {prefs.message.length}/{MAX_MESSAGE}
        </small>
      </label>

      <div className="message-preview">
        <span>PREVIEW</span>
        <p>
          {profile.name || "Your name"}: {prefs.message}{" "}
          {prefs.includeLocation ? "maps.google.com/?q=25.578,91.893" : ""} Call 112 if there is immediate danger.
        </p>
      </div>

      <Button className="link" onClick={() => setPrefs(defaultEmergencyPrefs)}>
        Restore defaults
      </Button>
    </ScreenLayout>
  )
}
