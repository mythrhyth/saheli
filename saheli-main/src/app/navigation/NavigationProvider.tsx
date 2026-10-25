import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { ScreenEntry, ScreenName, ScreenParams, TabName } from "./types"
import { NavigationContext } from "./useNavigation"

/**
 * Tab + screen-stack navigation. Each opened screen pushes a browser history entry,
 * so the browser / Android back button closes screens naturally.
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabName>("home")
  const [stack, setStack] = useState<ScreenEntry[]>([])
  const stackRef = useRef<ScreenEntry[]>([])

  useEffect(() => {
    window.history.replaceState({ depth: 0 }, "")
    const onPop = (event: PopStateEvent) => {
      const depth = (event.state as { depth?: number } | null)?.depth ?? 0
      stackRef.current = stackRef.current.slice(0, depth)
      setStack(stackRef.current)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const open = useCallback((name: ScreenName, params: ScreenParams = {}) => {
    const next = [...stackRef.current, { name, params }]
    stackRef.current = next
    window.history.pushState({ depth: next.length }, "")
    setStack(next)
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(() => {
    if (stackRef.current.length) window.history.back()
  }, [])

  const closeAll = useCallback(() => {
    const depth = stackRef.current.length
    if (depth) window.history.go(-depth)
  }, [])

  const goTab = useCallback(
    (next: TabName) => {
      closeAll()
      setTab(next)
      window.scrollTo(0, 0)
    },
    [closeAll],
  )

  const value = useMemo(
    () => ({ tab, stack, current: stack[stack.length - 1] ?? null, open, back, closeAll, goTab }),
    [tab, stack, open, back, closeAll, goTab],
  )

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}
