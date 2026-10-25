import { useEffect, useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Button, Icon, SettingToggle, Toast } from "@/components/ui"
import { useToast } from "@/hooks/useToast"
import { vibrate } from "@/lib/device"
import { FakeCall } from "./FakeCall"
import { useDiscreetPrefs } from "./useDiscreetTriggers"

type MotionPermissionApi = { requestPermission?: () => Promise<string> }

export default function DiscreetSosScreen() {
  const { back } = useNavigation()
  const [prefs, setPrefs] = useDiscreetPrefs()
  const [taps, setTaps] = useState<number[]>([])
  const [practiced, setPracticed] = useState(false)
  const [calling, setCalling] = useState(false)
  const [callDelay, setCallDelay] = useState(0)
  const [toast, showToast] = useToast()

  // "Call in 10 s" countdown.
  useEffect(() => {
    if (callDelay <= 0) return
    const id = setTimeout(() => {
      if (callDelay === 1) setCalling(true)
      setCallDelay(callDelay - 1)
    }, 1000)
    return () => clearTimeout(id)
  }, [callDelay])

  const practiceTap = () => {
    const now = Date.now()
    const recent = [...taps.filter((t) => now - t < 1500), now]
    if (recent.length >= 3) {
      setPracticed(true)
      setTaps([])
      vibrate([80, 60, 80])
    } else setTaps(recent)
  }

  const setShake = async (enabled: boolean) => {
    if (enabled) {
      if (!("DeviceMotionEvent" in window)) return showToast("Shake detection isn't supported on this device.")
      const api = (window as unknown as { DeviceMotionEvent: MotionPermissionApi }).DeviceMotionEvent
      if (api.requestPermission) {
        try {
          if ((await api.requestPermission()) !== "granted") return showToast("Motion permission was not granted.")
        } catch {
          return showToast("Motion access is unavailable.")
        }
      }
    }
    setPrefs({ ...prefs, shake: enabled })
  }

  if (calling) return <FakeCall caller={prefs.fakeCaller || "Mom"} onClose={() => setCalling(false)} />

  return (
    <ScreenLayout title="Discreet SOS" onBack={back}>
      <Toast text={toast} />
      <p className="lead">
        Send an alert without anyone noticing. A discreet SOS shows no alert screen. It quietly queues your location for
        your SOS contacts and gives one short vibration.
      </p>
      <SettingToggle
        title="Enable discreet SOS"
        sub={prefs.enabled ? "On" : "Off. Triggers below won't do anything."}
        value={prefs.enabled}
        set={(enabled) => setPrefs({ ...prefs, enabled })}
      />

      <section className="setting-block">
        <strong className="block-label">Triggers</strong>
        <SettingToggle
          title="Triple-tap the Saheli logo"
          sub="On the Home screen, tap the logo 3 times quickly"
          value={prefs.tripleTap}
          set={(tripleTap) => setPrefs({ ...prefs, tripleTap })}
        />
        <SettingToggle
          title="Shake phone firmly"
          sub="Three strong shakes while Saheli is open"
          value={prefs.shake}
          set={(v) => void setShake(v)}
        />
      </section>

      <section className="setting-block">
        <strong className="block-label">Practice (nothing is sent)</strong>
        <Button className={`practice-pad ${practiced ? "done" : ""}`} onClick={practiceTap}>
          {practiced ? (
            <>
              <Icon name="check" />
              Practice worked. Nothing was sent.
            </>
          ) : (
            <>
              <span className="brandmark">
                <Icon name="shield" size={19} />
              </span>
              Triple-tap here {taps.length ? `(${taps.length}/3)` : ""}
            </>
          )}
        </Button>
      </section>

      <section className="setting-block">
        <strong className="block-label">Fake incoming call</strong>
        <p className="muted left">Use a realistic incoming call to leave an uncomfortable situation.</p>
        <label className="field">
          Caller name
          <input
            value={prefs.fakeCaller}
            maxLength={24}
            onChange={(e) => setPrefs({ ...prefs, fakeCaller: e.target.value })}
          />
        </label>
        <div className="dual-actions spaced">
          <Button className="secondary" onClick={() => setCalling(true)}>
            Call me now
          </Button>
          <Button className="secondary" onClick={() => setCallDelay(10)} disabled={callDelay > 0}>
            {callDelay > 0 ? `Ringing in ${callDelay}s…` : "Call in 10 s"}
          </Button>
        </div>
      </section>
    </ScreenLayout>
  )
}
