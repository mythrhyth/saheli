import type { Coords } from "@/types"

export function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function formatDate(ms: number) {
  const date = new Date(ms)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const day =
    date.toDateString() === today.toDateString()
      ? "Today"
      : date.toDateString() === yesterday.toDateString()
        ? "Yesterday"
        : date.toLocaleDateString([], { day: "numeric", month: "short" })
  return `${day}, ${formatTime(ms)}`
}

/** Seconds → "m:ss". Negative values clamp to 0:00. */
export function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export function mapsLink(c: Coords) {
  return `https://maps.google.com/?q=${c.lat.toFixed(5)},${c.lng.toFixed(5)}`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10)
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`
}

export function greetingKey(hour = new Date().getHours()) {
  return hour < 12 ? "goodMorning" : hour < 17 ? "goodAfternoon" : "goodEvening"
}

export function timeOfDay(hour = new Date().getHours()) {
  return hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 20 ? "Evening" : "Night"
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
