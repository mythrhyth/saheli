import { api } from "@/lib/api"
import { contactNames, contactsStrictlyWithRole } from "@/lib/contacts"
import { getLocation, vibrate } from "@/lib/device"
import { mapsLink } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import type { Contact, Profile } from "@/types"

/** Sends an SOS with no visible UI, only one short vibration. Used by discreet triggers. */
export async function silentSos(contacts: Contact[], profile: Profile) {
  const coords = await getLocation()
  queueMessage({
    kind: "sos",
    title: "Discreet SOS",
    body: `${profile.name || "Your contact"} triggered a discreet SOS and may not be able to talk. ${coords ? mapsLink(coords) : "Location unavailable."} Call 112 if there is immediate danger.`,
    recipients: contactNames(contactsStrictlyWithRole(contacts, "SOS recipient")),
    location: coords,
  })
  if (api.getToken()) {
    api
      .post("/sos", {
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        message: "Discreet SOS triggered.",
      })
      .catch(() => {})
  }
  vibrate([80, 60, 80])
}
