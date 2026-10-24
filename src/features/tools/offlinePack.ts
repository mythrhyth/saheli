import { STORAGE_KEYS } from "@/config/constants"
import { SAFETY_GUIDANCE } from "@/data/guidance"
import { HELPLINES } from "@/data/helplines"
import { SHELTERS } from "@/data/shelters"
import { writeJSON } from "@/lib/storage"
import type { Contact, OfflineContact, OfflinePackMeta } from "@/types"

export type OfflineContent = { contacts: OfflineContact[] }

/** Saves emergency essentials (helplines, guidance, shelters, contacts) on the device. */
export function downloadOfflinePack(contacts: Contact[]): OfflinePackMeta {
  const content = {
    helplines: HELPLINES,
    guidance: SAFETY_GUIDANCE,
    shelters: SHELTERS,
    contacts: contacts.map(({ name, phone, relation }) => ({ name, phone, relation })),
  }
  writeJSON(STORAGE_KEYS.offlineContent, content)
  const meta = { savedAt: Date.now(), size: JSON.stringify(content).length }
  writeJSON(STORAGE_KEYS.offlinePack, meta)
  return meta
}

export const formatPackSize = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`
