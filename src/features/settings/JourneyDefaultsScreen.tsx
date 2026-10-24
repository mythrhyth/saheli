import { useNavigation } from "@/app/navigation/useNavigation"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Button, Segmented, SettingToggle } from "@/components/ui"
import { STORAGE_KEYS, TRANSPORT_SPEEDS } from "@/config/constants"
import { defaultJourneyDefaults } from "@/config/defaults"
import { usePersistedState } from "@/hooks/usePersistedState"
import type { JourneyDefaults } from "@/types"

const INTERVALS = [5, 10, 15, 30, 45, 60]
const GRACE: [number, string][] = [
  [2, "2 min"],
  [5, "5 min"],
  [10, "10 min"],
]
const MODES = Object.keys(TRANSPORT_SPEEDS).map((mode) => [mode, mode] as [string, string])

export default function JourneyDefaultsScreen() {
  const { back } = useNavigation()
  const [prefs, setPrefs] = usePersistedState<JourneyDefaults>(STORAGE_KEYS.journeyDefaults, defaultJourneyDefaults)

  return (
    <ScreenLayout title="Journey check-in defaults" onBack={back}>
      <section className="setting-block">
        <strong className="block-label">Check-in interval</strong>
        <div className="duration-grid three">
          {INTERVALS.map((m) => (
            <Button
              key={m}
              className={prefs.interval === m ? "active" : ""}
              onClick={() => setPrefs({ ...prefs, interval: m })}
            >
              {m} min
            </Button>
          ))}
        </div>
      </section>

      <section className="setting-block">
        <strong className="block-label">Grace period after a missed check-in</strong>
        <Segmented
          label="Grace period"
          options={GRACE}
          value={prefs.grace}
          set={(grace) => setPrefs({ ...prefs, grace })}
        />
      </section>

      <SettingToggle
        title="Start check-in with every journey"
        value={prefs.autoCheckin}
        set={(autoCheckin) => setPrefs({ ...prefs, autoCheckin })}
      />
      <SettingToggle
        title="Share live location with journey viewers"
        sub="Starts sharing until the journey ends"
        value={prefs.autoShare}
        set={(autoShare) => setPrefs({ ...prefs, autoShare })}
      />

      <section className="setting-block">
        <strong className="block-label">Default way of travelling</strong>
        <Segmented label="Transport" options={MODES} value={prefs.mode} set={(mode) => setPrefs({ ...prefs, mode })} />
      </section>

      <p className="fineprint">
        Missed check-ins alert contacts with the Journey viewer role, using each contact's escalation setting.
      </p>
    </ScreenLayout>
  )
}
