/**
 * Thin wrapper around localStorage. Every write emits a `saheli-store` event so that
 * `usePersistedState` hooks reading the same key stay in sync across components.
 */
export const STORE_EVENT = "saheli-store"

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function readArray<T>(key: string): T[] {
  const value = readJSON<unknown>(key, [])
  return Array.isArray(value) ? (value as T[]) : []
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked (private mode) */
  }
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: key }))
}

export function removeKey(key: string) {
  localStorage.removeItem(key)
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: key }))
}

export function clearAll() {
  localStorage.clear()
}
