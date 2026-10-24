/** Domain models shared across features. These are the shapes the backend will need to persist. */

export type ContactRole = "SOS recipient" | "Journey viewer" | "Disaster check-in recipient"

export type Contact = {
  id: number
  name: string
  relation: string
  phone: string
  roles: string[]
  escalation: string
}

export type Profile = { name: string; city: string; phone: string }

export type SharingStatus = "live" | "paused" | "ended" | "failed"
export type SharingSession = {
  id: number
  contactIds: number[]
  status: SharingStatus
  endsAt: number | null
  startedAt: number
}

export type JourneyHistory = { id: number; route: string; date: string; endedAt?: number }
export type ActiveJourney = { id: number; from: string; to: string; route: string; mode: string; startedAt: number }
export type RouteDraft = { from: string; destination: string }

export type CheckInStatus = "running" | "missed" | "escalated"
export type CheckIn = {
  id: number
  startedAt: number
  dueAt: number
  interval: number
  grace: number
  status: CheckInStatus
  label: string
}

export type Coords = { lat: number; lng: number; accuracy: number }

export type OutboxKind =
  | "sos"
  | "sos-cancel"
  | "checkin-safe"
  | "checkin-missed"
  | "disaster-safe"
  | "disaster-help"
  | "test"
  | "report"
  | "journey"
  | "sharing"
export type OutboxItem = {
  id: number
  at: number
  kind: OutboxKind
  title: string
  body: string
  recipients: string[]
  location?: Coords | null
  status: "queued"
}

export type Report = {
  id: number
  category: string
  area: string
  when: string
  detail: string
  anonymous: boolean
  at: number
}
export type EvidenceEntry = { id: number; platform: string; when: string; detail: string; link: string }

export type ShelterStatus = "Confirmed" | "Reported" | "Unknown"
export type Shelter = {
  id: number
  name: string
  type: string
  status: ShelterStatus
  distance: number
  area: string
  womenOnly: boolean
  accessible: boolean
  open24: boolean
  facilities: string[]
  phone?: string
  access: string
}

export type OfflinePackMeta = { savedAt: number; size: number }
export type OfflineContact = { name: string; phone: string; relation: string }

/* Preferences */
export type Theme = "light" | "dark" | "system"
export type TextSize = "normal" | "large"
export type DisplayPrefs = {
  theme: Theme
  textSize: TextSize
  simplified: boolean
  reduceMotion: boolean
  voice: boolean
}
export type EmergencyPrefs = {
  countdown: number
  includeLocation: boolean
  repeatMins: number
  message: string
  showCall112: boolean
}
export type JourneyDefaults = {
  interval: number
  grace: number
  autoCheckin: boolean
  autoShare: boolean
  mode: string
}
export type DiscreetPrefs = { enabled: boolean; tripleTap: boolean; shake: boolean; fakeCaller: string }
export type NotifPrefs = { checkin: boolean; sharing: boolean; alerts: boolean; reports: boolean }

export type PermissionStatus = "granted" | "denied" | "prompt" | "default" | "unavailable"
