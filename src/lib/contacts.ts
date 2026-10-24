import type { Contact, ContactRole } from "@/types"

/** Contacts with the given role, falling back to all contacts when nobody has it. */
export function contactsWithRole(contacts: Contact[], role: ContactRole) {
  const withRole = contacts.filter((c) => c.roles.includes(role))
  return withRole.length ? withRole : contacts
}

/** Contacts that strictly have the given role (no fallback). */
export function contactsStrictlyWithRole(contacts: Contact[], role: ContactRole) {
  return contacts.filter((c) => c.roles.includes(role))
}

export const contactNames = (list: Contact[]) => list.map((c) => c.name)
