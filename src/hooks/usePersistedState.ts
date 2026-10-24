import { useCallback, useEffect, useRef, useState } from "react"
import { STORE_EVENT, readJSON, writeJSON } from "@/lib/storage"

/**
 * Like useState, but persisted in localStorage under `key`.
 * All hooks using the same key stay in sync (within the tab).
 */
export function usePersistedState<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => readJSON(key, fallback))
  const fallbackRef = useRef(fallback)

  useEffect(() => {
    const sync = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) setValue(readJSON(key, fallbackRef.current))
    }
    window.addEventListener(STORE_EVENT, sync)
    return () => window.removeEventListener(STORE_EVENT, sync)
  }, [key])

  const update = useCallback(
    (next: T) => {
      setValue(next)
      writeJSON(key, next)
    },
    [key],
  )

  return [value, update]
}
