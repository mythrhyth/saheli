import { useCallback, useEffect, useRef, useState } from "react"

/** Transient status message. Returns the current text and a function to show a new one. */
export function useToast(durationMs = 4500): [string, (text: string) => void] {
  const [text, setText] = useState("")
  const timer = useRef<number>(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const show = useCallback(
    (next: string) => {
      setText(next)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setText(""), durationMs)
    },
    [durationMs],
  )

  return [text, show]
}
