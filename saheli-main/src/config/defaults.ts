import type { DiscreetPrefs, DisplayPrefs, EmergencyPrefs, JourneyDefaults, NotifPrefs, Profile } from "@/types"

export const defaultProfile: Profile = { name: "", city: "Shillong, Meghalaya", phone: "" }

export const defaultDisplayPrefs: DisplayPrefs = {
  theme: "system",
  textSize: "normal",
  simplified: false,
  reduceMotion: false,
  voice: false,
}

export const defaultEmergencyPrefs: EmergencyPrefs = {
  countdown: 5,
  includeLocation: true,
  repeatMins: 5,
  message: "I need help. This is my last known location.",
  showCall112: true,
}

export const defaultJourneyDefaults: JourneyDefaults = {
  interval: 15,
  grace: 5,
  autoCheckin: true,
  autoShare: false,
  mode: "Walk",
}

export const defaultDiscreetPrefs: DiscreetPrefs = { enabled: false, tripleTap: true, shake: false, fakeCaller: "Mom" }

export const defaultNotifPrefs: NotifPrefs = { checkin: true, sharing: true, alerts: true, reports: false }
