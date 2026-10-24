import { useEffect } from "react"
import { STORAGE_KEYS } from "@/config/constants"
import { usePersistedState } from "@/hooks/usePersistedState"
import { contactNames, contactsWithRole } from "@/lib/contacts"
import { getLocation, notify } from "@/lib/device"
import { formatTime, mapsLink } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import type { CheckIn, Contact, Profile } from "@/types"
import { graceEndsAt } from "./checkin"

export function useCheckIn() {
  return usePersistedState<CheckIn | null>(STORAGE_KEYS.checkIn, null)
}

/**
 * Drives the check-in lifecycle: running → missed (when due) → escalated (after the grace period).
 * Mounted once in the app shell so it works no matter which screen is open.
 */
export function useCheckInEngine(contacts: Contact[], profile: Profile) {
  const [checkIn, setCheckIn] = useCheckIn()

  useEffect(() => {
    if (!checkIn || checkIn.status === "escalated") return
    const id = setInterval(() => {
      const now = Date.now()
      if (checkIn.status === "running" && now >= checkIn.dueAt) {
        setCheckIn({ ...checkIn, status: "missed" })
        notify("Check-in due", "Tap I'm safe in Saheli, or your contacts will be alerted.", "checkin")
      } else if (checkIn.status === "missed" && now >= graceEndsAt(checkIn)) {
        const recipients = contactsWithRole(contacts, "Journey viewer")
        void getLocation().then((coords) =>
          queueMessage({
            kind: "checkin-missed",
            title: "Missed check-in",
            body: `${profile.name || "Your contact"} missed a check-in (${checkIn.label}) due at ${formatTime(checkIn.dueAt)}. ${coords ? `Last known location: ${mapsLink(coords)}` : "Location unavailable."} Try calling first.`,
            recipients: contactNames(recipients),
            location: coords,
          }),
        )
        setCheckIn({ ...checkIn, status: "escalated" })
        notify("Contacts alerted", "Your missed check-in was escalated.", "checkin")
      }
    }, 1000)
    return () => clearInterval(id)
  }, [checkIn, contacts, profile.name, setCheckIn])
}
