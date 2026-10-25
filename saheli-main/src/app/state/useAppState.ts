import { createContext, useContext } from "react"
import type { ActiveJourney, Contact, DisplayPrefs, JourneyHistory, Profile, SharingSession } from "@/types"

export type AppState = {
  onboarded: boolean
  completeOnboarding: () => void
  replayOnboarding: () => void

  profile: Profile
  setProfile: (profile: Profile) => void

  contacts: Contact[]
  setContacts: (contacts: Contact[]) => void

  session: SharingSession | null
  setSession: (session: SharingSession | null) => void

  history: JourneyHistory[]
  setHistory: (history: JourneyHistory[]) => void
  journey: ActiveJourney | null
  startJourney: (route: string, mode: string) => Promise<void>
  endJourney: () => void

  displayPrefs: DisplayPrefs
  setDisplayPrefs: (prefs: DisplayPrefs) => void

  locationStatus: string
  requestLocation: () => Promise<string>
  notificationStatus: string
  requestNotifications: () => Promise<string>

  alertActive: boolean
  dismissAlert: () => void

  resetAllData: () => void
}

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) throw new Error("useAppState must be used inside <AppStateProvider>")
  return context
}
