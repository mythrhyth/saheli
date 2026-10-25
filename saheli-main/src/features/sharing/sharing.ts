import type { SharingSession } from "@/types"

export const isSharingActive = (session: SharingSession | null): session is SharingSession =>
  session?.status === "live" || session?.status === "paused"

/** "m:ss" left, "until stopped", or "" when ended. */
export function sharingTimeLeft(session: SharingSession | null) {
  if (!session || session.status === "ended") return ""
  if (!session.endsAt) return "until stopped"
  const seconds = Math.max(0, Math.floor((session.endsAt - Date.now()) / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}
