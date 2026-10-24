import { STORAGE_KEYS } from "@/config/constants"
import type { OutboxItem } from "@/types"
import { api } from "./api"
import { readJSON, writeJSON } from "./storage"

const MAX_ITEMS = 100

/**
 * Records a message meant for trusted contacts (or moderators).
 * Offline-first: saves immediately to local storage, then syncs to backend if authenticated.
 */
export function queueMessage(item: Omit<OutboxItem, "id" | "at" | "status">): OutboxItem {
  const localId = Date.now() + Math.random()
  const entry: OutboxItem = { ...item, id: localId, at: Date.now(), status: "queued" }
  const existing = readJSON<OutboxItem[]>(STORAGE_KEYS.outbox, [])
  writeJSON(STORAGE_KEYS.outbox, [entry, ...existing].slice(0, MAX_ITEMS))

  // Asynchronous backend dispatch if authenticated
  if (api.getToken()) {
    api
      .post<{ message: { status: "mock_delivered" | "delivered" | "queued" | "failed"; id: number } }>("/messages", {
        kind: item.kind,
        title: item.title,
        body: item.body,
        recipients: item.recipients,
        location: item.location ?? null,
      })
      .then((res) => {
        if (res?.message?.status) {
          const current = readJSON<OutboxItem[]>(STORAGE_KEYS.outbox, [])
          const updated = current.map((m) =>
            m.id === localId ? { ...m, status: res.message.status as OutboxItem["status"] } : m,
          )
          writeJSON(STORAGE_KEYS.outbox, updated)
        }
      })
      .catch(() => {
        // Keeps status as "queued" on network failure
      })
  }

  return entry
}
