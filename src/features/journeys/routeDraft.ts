import { STORAGE_KEYS } from "@/config/constants"
import { readJSON, writeJSON } from "@/lib/storage"
import type { RouteDraft } from "@/types"

/** The from/to pair handed from Home / Explore / Journeys to the route planning screen. */
export function saveRouteDraft(draft: RouteDraft) {
  writeJSON(STORAGE_KEYS.routeDraft, draft)
}

export function readRouteDraft(defaultFrom: string): RouteDraft {
  return readJSON<RouteDraft>(STORAGE_KEYS.routeDraft, { from: defaultFrom, destination: "" })
}

export const ROUTE_SEPARATOR = " → "
export const splitRoute = (route: string) => {
  const [from = "", destination = ""] = route.split(ROUTE_SEPARATOR)
  return { from, destination }
}
