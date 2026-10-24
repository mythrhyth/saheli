export type TabName = "home" | "explore" | "journeys" | "contacts" | "profile"

/** Screens that open on top of the tabs (a stack, wired to browser history). */
export type ScreenName =
  | "sos"
  | "discreet"
  | "route"
  | "assessment"
  | "share"
  | "checkin"
  | "assistant"
  | "offline"
  | "tools"
  | "digital"
  | "report"
  | "shelter"
  | "disaster"
  | "location"
  | "settings"
  | "language"
  | "notifications"
  | "accessibility"
  | "emergency"
  | "defaults"
  | "help"
  | "about"
  | "privacy"
  | "recipient"

export type ScreenParams = {
  /** Report a concern: pre-selected area. */
  area?: string
  /** Disaster screen: scroll straight to the check-in section. */
  focusCheckin?: boolean
}

export type ScreenEntry = { name: ScreenName; params: ScreenParams }
