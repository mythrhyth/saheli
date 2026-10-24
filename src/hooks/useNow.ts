import { useEffect, useState } from "react"

/** Current timestamp, refreshed every `intervalMs`. Use for countdowns and elapsed timers. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
