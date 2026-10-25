import type { ContactRole } from "@/types"

export const APP_VERSION = "1.0.0"

/** Every localStorage key the app uses. Values are kept stable so existing data survives upgrades. */
export const STORAGE_KEYS = {
  onboardingDone: "onboardingDone",
  language: "language",
  displayPrefs: "prefs",
  profile: "profile",
  contacts: "contacts",
  sharingSession: "sharingSession",
  journeyHistory: "journeyHistory",
  activeJourney: "activeJourney",
  routeDraft: "routeDraft",
  checkIn: "checkIn",
  emergencyPrefs: "emergencyPrefs",
  journeyDefaults: "journeyDefaults",
  discreetPrefs: "discreetPrefs",
  notifPrefs: "notifPrefs",
  outbox: "outbox",
  offlinePack: "offlinePack",
  offlineContent: "offlineContent",
  reports: "reports",
  evidenceLog: "evidenceLog",
  securityChecklist: "securityChecklist",
  retention: "retention",
  alertActive: "alertActive",
  locationStatus: "locationStatus",
  assistantChat: "assistantChat",
} as const

export const ROLES: ContactRole[] = ["SOS recipient", "Journey viewer", "Disaster check-in recipient"]
export const ESCALATIONS = [
  "Notify immediately",
  "Notify after 5 minutes",
  "Notify after 10 minutes",
  "Call first, then notify",
]
export const DEFAULT_ESCALATION = "Notify after 5 minutes"

export const RETENTION_OPTIONS = ["Until I delete it", "30 days", "7 days", "Don't save journey history"] as const
export const RETENTION_DAYS: Record<string, number> = { "30 days": 30, "7 days": 7 }

export const LANGUAGES: [code: string, label: string][] = [
  ["en", "English"],
  ["hi", "हिन्दी"],
  ["bn", "বাংলা"],
  ["ne", "नेपाली"],
  ["kha", "Khasi"],
  ["garo", "Garo"],
]
export const FULLY_TRANSLATED = ["en", "hi"]

/** Average speed in km/h used to estimate journey times per transport mode. */
export const TRANSPORT_SPEEDS: Record<string, number> = { Walk: 4.8, Bus: 18, Taxi: 24, Auto: 20 }
