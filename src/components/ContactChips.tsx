import { Button, Icon } from "@/components/ui"
import { initials } from "@/lib/format"
import type { Contact } from "@/types"

type ContactChipsProps = {
  contacts: Pick<Contact, "id" | "name">[]
  /** Message shown when the list is empty. */
  empty?: string
  onManage?: () => void
}

/** Compact list of contacts who will receive an alert. */
export function ContactChips({ contacts, empty, onManage }: ContactChipsProps) {
  return (
    <div className="recipient-list">
      {contacts.length
        ? contacts.map((c) => (
            <span key={c.id} className="recipient-chip">
              <span className="avatar small">{initials(c.name)}</span>
              {c.name}
            </span>
          ))
        : empty && <p className="permission-message small-note">{empty}</p>}
      {onManage && (
        <Button className="link" onClick={onManage}>
          Manage contacts
          <Icon name="chevron" size={13} />
        </Button>
      )}
    </div>
  )
}
