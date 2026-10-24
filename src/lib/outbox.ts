import { STORAGE_KEYS } from "@/config/constants"
import type { OutboxItem } from "@/types"
import { readJSON, writeJSON } from "./storage"

const MAX_ITEMS = 100

/**
 * Records a message meant for trusted contacts (or moderators).
 * BACKEND INTEGRATION POINT: replace/extend this with an API call. See docs/BACKEND_HANDOFF.md.
 */
export function queueMessage(item: Omit<OutboxItem, "id" | "at" | "status">): OutboxItem {
  const entry: OutboxItem = { ...item, id: Date.now() + Math.random(), at: Date.now(), status: "queued" }
  const existing = readJSON<OutboxItem[]>(STORAGE_KEYS.outbox, [])
  writeJSON(STORAGE_KEYS.outbox, [entry, ...existing].slice(0, MAX_ITEMS))
  return entry
}
