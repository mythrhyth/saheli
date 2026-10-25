import type { IconName } from "@/components/ui"

/** Icons for the intro slides; slide copy comes from the `introNTitle` / `introNBody` translation keys. */
export const INTRO_SLIDE_ICONS: IconName[] = ["route", "share", "alert"]

/** Setup steps shown after the intro, in order. */
export const SETUP_STEPS: [titleKey: string, bodyKey: string, icon: IconName][] = [
  ["contactsTitle", "contactsBody", "users"],
  ["locationTitle", "locationBody", "pin"],
  ["notificationTitle", "notificationBody", "bell"],
  ["emergencyTitle", "emergencyBody", "alert"],
  ["discreetTitle", "discreetBody", "shield"],
  ["offlineTitle", "offlineBody", "download"],
]
