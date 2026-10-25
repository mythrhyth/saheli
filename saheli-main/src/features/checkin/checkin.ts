import { STORAGE_KEYS } from "@/config/constants"
import { writeJSON } from "@/lib/storage"
import type { CheckIn } from "@/types"

/** Starts (or restarts) a check-in timer. Saved globally so it keeps running across screens. */
export function startCheckIn(minutes: number, grace: number, label: string): CheckIn {
  const now = Date.now()
  const checkIn: CheckIn = {
    id: now,
    startedAt: now,
    dueAt: now + minutes * 60000,
    interval: minutes,
    grace,
    status: "running",
    label,
  }
  writeJSON(STORAGE_KEYS.checkIn, checkIn)
  return checkIn
}

export const graceEndsAt = (checkIn: CheckIn) => checkIn.dueAt + checkIn.grace * 60000
