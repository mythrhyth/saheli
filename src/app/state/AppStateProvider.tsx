import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { STORAGE_KEYS } from "@/config/constants"
import { defaultDisplayPrefs, defaultJourneyDefaults, defaultProfile } from "@/config/defaults"
import { startCheckIn } from "@/features/checkin/checkin"
import { applyRetention } from "@/features/privacy/retention"
import { contactNames, contactsWithRole } from "@/lib/contacts"
import { getLocation } from "@/lib/device"
import { formatDate, mapsLink } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import { clearAll, readArray, readJSON, writeJSON } from "@/lib/storage"
import { usePersistedState } from "@/hooks/usePersistedState"
import type {
  ActiveJourney,
  CheckIn,
  Contact,
  DisplayPrefs,
  JourneyDefaults,
  JourneyHistory,
  Profile,
  RouteDraft,
  SharingSession,
} from "@/types"

import { AppStateContext, type AppState } from "./useAppState"

/* ── Loading helpers: tolerate missing or malformed saved data ── */

function loadContacts(): Contact[] {
  return readArray<Partial<Contact>>(STORAGE_KEYS.contacts)
    .filter((c) => c.name && c.phone)
    .map((c, i) => ({
      id: c.id || i + 1,
      name: c.name!,
      relation: c.relation || "Contact",
      phone: c.phone!,
      roles: Array.isArray(c.roles) ? c.roles : ["SOS recipient"],
      escalation: c.escalation || "Notify after 5 minutes",
    }))
}

function loadSession(): SharingSession | null {
  const value = readJSON<Partial<SharingSession> | null>(STORAGE_KEYS.sharingSession, null)
  const valid =
    value && Array.isArray(value.contactIds) && ["live", "paused", "ended", "failed"].includes(value.status ?? "")
  return valid ? (value as SharingSession) : null
}

const isActive = (session: SharingSession | null) => session?.status === "live" || session?.status === "paused"

/** Global app state: user data that several features read and write. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(STORAGE_KEYS.onboardingDone) === "true")
  const [profile, setProfile] = usePersistedState<Profile>(STORAGE_KEYS.profile, defaultProfile)
  const [journey, setJourney] = usePersistedState<ActiveJourney | null>(STORAGE_KEYS.activeJourney, null)
  const [alertActive, setAlertActive] = usePersistedState<boolean>(STORAGE_KEYS.alertActive, true)
  const [contacts, setContactsState] = useState<Contact[]>(loadContacts)
  const [session, setSessionState] = useState<SharingSession | null>(loadSession)
  const [history, setHistoryState] = useState<JourneyHistory[]>(() =>
    applyRetention(readArray<JourneyHistory>(STORAGE_KEYS.journeyHistory)),
  )
  const [displayPrefs, setDisplayPrefsState] = useState<DisplayPrefs>(() => ({
    ...defaultDisplayPrefs,
    ...readJSON<Partial<DisplayPrefs>>(STORAGE_KEYS.displayPrefs, {}),
  }))
  const [locationStatus, setLocationStatus] = useState(
    () => localStorage.getItem(STORAGE_KEYS.locationStatus) || "prompt",
  )
  const [notificationStatus, setNotificationStatus] = useState<string>(() =>
    typeof Notification !== "undefined" ? Notification.permission : "unavailable",
  )

  const setSession = useCallback((next: SharingSession | null) => {
    setSessionState(next)
    writeJSON(STORAGE_KEYS.sharingSession, next)
  }, [])

  const setContacts = useCallback(
    (next: Contact[]) => {
      setContactsState(next)
      writeJSON(STORAGE_KEYS.contacts, next)
      // Removing a contact also revokes their access to an active sharing session.
      if (session && isActive(session)) {
        const ids = session.contactIds.filter((id) => next.some((c) => c.id === id))
        if (ids.length !== session.contactIds.length) {
          setSession(ids.length ? { ...session, contactIds: ids } : { ...session, status: "ended" })
        }
      }
    },
    [session, setSession],
  )

  const setHistory = useCallback((next: JourneyHistory[]) => {
    setHistoryState(next)
    writeJSON(STORAGE_KEYS.journeyHistory, next)
  }, [])

  const setDisplayPrefs = useCallback((next: DisplayPrefs) => {
    setDisplayPrefsState(next)
    writeJSON(STORAGE_KEYS.displayPrefs, next)
  }, [])

  // End time-limited sharing when it expires.
  useEffect(() => {
    if (session?.status !== "live" || !session.endsAt) return
    const endsAt = session.endsAt
    const id = setInterval(() => {
      if (Date.now() >= endsAt) setSession({ ...session, status: "ended" })
    }, 1000)
    return () => clearInterval(id)
  }, [session, setSession])

  const requestLocation = useCallback(
    () =>
      new Promise<string>((resolve) => {
        const finish = (status: string) => {
          setLocationStatus(status)
          if (status !== "unavailable") localStorage.setItem(STORAGE_KEYS.locationStatus, status)
          resolve(status)
        }
        if (!navigator.geolocation) return finish("unavailable")
        navigator.geolocation.getCurrentPosition(
          () => finish("granted"),
          () => finish("denied"),
          { timeout: 8000 },
        )
      }),
    [],
  )

  const requestNotifications = useCallback(async () => {
    if (!("Notification" in window)) {
      setNotificationStatus("unavailable")
      return "unavailable"
    }
    const status = await Notification.requestPermission()
    setNotificationStatus(status)
    return status
  }, [])

  const startJourney = useCallback(
    async (route: string, mode: string) => {
      const draft = readJSON<RouteDraft>(STORAGE_KEYS.routeDraft, { from: "Current location", destination: "" })
      const defaults = readJSON<JourneyDefaults>(STORAGE_KEYS.journeyDefaults, defaultJourneyDefaults)
      setJourney({ id: Date.now(), from: draft.from, to: draft.destination, route, mode, startedAt: Date.now() })
      if (defaults.autoCheckin) startCheckIn(defaults.interval, defaults.grace, `Journey to ${draft.destination}`)

      const viewers = contactsWithRole(contacts, "Journey viewer")
      if (!viewers.length) return
      const coords = await getLocation(4000)
      queueMessage({
        kind: "journey",
        title: "Journey started",
        body: `${profile.name || "Your contact"} started a journey from ${draft.from} to ${draft.destination} (${route}, ${mode}).${coords ? ` ${mapsLink(coords)}` : ""}`,
        recipients: contactNames(viewers),
        location: coords,
      })
      if (defaults.autoShare && session?.status !== "live") {
        setSession({
          id: Date.now(),
          contactIds: viewers.map((c) => c.id),
          status: coords ? "live" : "failed",
          startedAt: Date.now(),
          endsAt: null,
        })
      }
    },
    [contacts, profile.name, session, setJourney, setSession],
  )

  const endJourney = useCallback(() => {
    if (!journey) return
    const now = Date.now()
    setHistory(
      applyRetention([
        { id: now, route: `${journey.from} → ${journey.to}`, date: formatDate(now), endedAt: now },
        ...history,
      ]),
    )
    const checkIn = readJSON<CheckIn | null>(STORAGE_KEYS.checkIn, null)
    if (checkIn?.label.startsWith("Journey")) writeJSON(STORAGE_KEYS.checkIn, null)
    const autoShare = readJSON<JourneyDefaults>(STORAGE_KEYS.journeyDefaults, defaultJourneyDefaults).autoShare
    if (autoShare && session?.status === "live" && !session.endsAt) setSession({ ...session, status: "ended" })
    setJourney(null)
  }, [journey, history, session, setHistory, setJourney, setSession])

  const value = useMemo<AppState>(
    () => ({
      onboarded,
      completeOnboarding: () => {
        localStorage.setItem(STORAGE_KEYS.onboardingDone, "true")
        setOnboarded(true)
      },
      replayOnboarding: () => {
        localStorage.removeItem(STORAGE_KEYS.onboardingDone)
        setOnboarded(false)
      },
      profile,
      setProfile,
      contacts,
      setContacts,
      session,
      setSession,
      history,
      setHistory,
      journey,
      startJourney,
      endJourney,
      displayPrefs,
      setDisplayPrefs,
      locationStatus,
      requestLocation,
      notificationStatus,
      requestNotifications,
      alertActive,
      dismissAlert: () => setAlertActive(false),
      resetAllData: () => {
        clearAll()
        window.location.reload()
      },
    }),
    [
      onboarded,
      profile,
      setProfile,
      contacts,
      setContacts,
      session,
      setSession,
      history,
      setHistory,
      journey,
      startJourney,
      endJourney,
      displayPrefs,
      setDisplayPrefs,
      locationStatus,
      requestLocation,
      notificationStatus,
      requestNotifications,
      alertActive,
      setAlertActive,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
