import { useCallback, useEffect, useRef } from "react"
import { STORAGE_KEYS } from "@/config/constants"
import { defaultDiscreetPrefs } from "@/config/defaults"
import { usePersistedState } from "@/hooks/usePersistedState"
import type { Contact, DiscreetPrefs, Profile } from "@/types"
import { silentSos } from "./silentSos"

const WINDOW_MS = 1500
const SHAKE_FORCE = 25

export function useDiscreetPrefs() {
  return usePersistedState<DiscreetPrefs>(STORAGE_KEYS.discreetPrefs, defaultDiscreetPrefs)
}

/** Records a tap/shake and returns true when three happened within the time window. */
function registerHit(hits: number[]) {
  const now = Date.now()
  const recent = [...hits.filter((t) => now - t < WINDOW_MS), now]
  return { recent, triggered: recent.length >= 3 }
}

/**
 * Wires the discreet SOS triggers (shake, logo triple-tap).
 * Returns the logo tap handler for the Home screen.
 */
export function useDiscreetTriggers(contacts: Contact[], profile: Profile) {
  const [prefs] = useDiscreetPrefs()
  const taps = useRef<number[]>([])

  useEffect(() => {
    if (!prefs.enabled || !prefs.shake) return
    let shakes: number[] = []
    const onMotion = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity
      if (!a || Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) < SHAKE_FORCE) return
      const { recent, triggered } = registerHit(shakes)
      shakes = triggered ? [] : recent
      if (triggered) void silentSos(contacts, profile)
    }
    window.addEventListener("devicemotion", onMotion)
    return () => window.removeEventListener("devicemotion", onMotion)
  }, [prefs.enabled, prefs.shake, contacts, profile])

  return useCallback(() => {
    if (!prefs.enabled || !prefs.tripleTap) return
    const { recent, triggered } = registerHit(taps.current)
    taps.current = triggered ? [] : recent
    if (triggered) void silentSos(contacts, profile)
  }, [prefs.enabled, prefs.tripleTap, contacts, profile])
}
