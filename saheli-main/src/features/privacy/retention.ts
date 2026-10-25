import { RETENTION_DAYS, STORAGE_KEYS } from "@/config/constants"
import { readJSON } from "@/lib/storage"
import type { JourneyHistory } from "@/types"

export const DEFAULT_RETENTION = "30 days"

export function getRetention() {
  return readJSON<string>(STORAGE_KEYS.retention, DEFAULT_RETENTION)
}

/** Drops journeys older than the user's retention setting. */
export function applyRetention(history: JourneyHistory[], retention = getRetention()) {
  if (retention === "Don't save journey history") return []
  const days = RETENTION_DAYS[retention]
  if (!days) return history
  const cutoff = Date.now() - days * 86400000
  return history.filter((journey) => !journey.endedAt || journey.endedAt >= cutoff)
}
