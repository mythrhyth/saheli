import { STORAGE_KEYS } from "@/config/constants"
import { defaultNotifPrefs } from "@/config/defaults"
import type { Coords, NotifPrefs } from "@/types"
import { readJSON } from "./storage"
import faviconUrl from "@/assets/favicon.svg"

/** Browser/device capabilities: location, notifications, vibration, speech. */

export function getLocation(timeout = 6000): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      () => resolve(null),
      { timeout, maximumAge: 60000 },
    )
  })
}

export function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}

export function notify(title: string, body: string, category: keyof NotifPrefs = "alerts") {
  if (!readJSON<NotifPrefs>(STORAGE_KEYS.notifPrefs, defaultNotifPrefs)[category]) return
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: faviconUrl })
    }
  } catch {
    /* some mobile browsers only allow notifications from a service worker */
  }
  vibrate([200, 100, 200])
}

/** Speaks text when the user has enabled voice guidance. */
export function speak(text: string) {
  if (!readJSON<{ voice?: boolean }>(STORAGE_KEYS.displayPrefs, {}).voice) return
  speakNow(text)
}

export function speakNow(text: string) {
  if (!("speechSynthesis" in window)) return
  speechSynthesis.cancel()
  speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}
