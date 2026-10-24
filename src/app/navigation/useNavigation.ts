import { createContext, useContext } from "react"
import type { ScreenEntry, ScreenName, ScreenParams, TabName } from "./types"

export type NavigationContextValue = {
  tab: TabName
  /** Stack of screens shown above the tabs; the last one is visible. */
  stack: ScreenEntry[]
  current: ScreenEntry | null
  open: (name: ScreenName, params?: ScreenParams) => void
  back: () => void
  closeAll: () => void
  /** Switch tab and close any open screens. */
  goTab: (tab: TabName) => void
}

export const NavigationContext = createContext<NavigationContextValue | null>(null)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) throw new Error("useNavigation must be used inside <NavigationProvider>")
  return context
}

/** Params passed to the currently visible screen. */
export function useScreenParams(): ScreenParams {
  return useNavigation().current?.params ?? {}
}
