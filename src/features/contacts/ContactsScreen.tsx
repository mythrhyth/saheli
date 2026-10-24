import { useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ScreenHeader } from "@/components/layout/ScreenLayout"
import { Button, EmptyState, Toast } from "@/components/ui"
import { useToast } from "@/hooks/useToast"
import { initials, telHref } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import type { ContactFormData } from "@/lib/validation"
import type { Contact } from "@/types"
import { ContactFormModal } from "./ContactFormModal"

/** Contacts tab: manage trusted contacts, their roles and escalation. */
export default function ContactsScreen() {
  const { open } = useNavigation()
  const { contacts, setContacts, profile } = useAppState()
  const [editing, setEditing] = useState<Contact | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [toast, showToast] = useToast(5000)

  const openForm = (contact: Contact | null = null) => {
    setEditing(contact)
    setFormOpen(true)
  }

  const save = (data: ContactFormData) => {
    setContacts(
      editing
        ? contacts.map((c) => (c.id === editing.id ? { ...c, ...data } : c))
        : [...contacts, { id: Date.now(), ...data }],
    )
    setFormOpen(false)
  }

  const sendTest = (contact: Contact) => {
    queueMessage({
      kind: "test",
      title: "Test message",
      body: `TEST, NO ACTION NEEDED. ${profile.name || "Your contact"} is testing their Saheli trusted-contact setup.`,
      recipients: [contact.name],
    })
    showToast(`Test message for ${contact.name} queued. It will be delivered once the messaging service is connected.`)
  }

  const remove = (contact: Contact) => {
    if (confirm(`Remove ${contact.name}?`)) setContacts(contacts.filter((c) => c.id !== contact.id))
  }

  return (
    <main className="screen-content feature-page">
      <ScreenHeader title="Trusted contacts" eyebrow="SAHELI" />
      <Toast text={toast} />

      {!contacts.length ? (
        <EmptyState
          icon="＋"
          title="No trusted contacts yet"
          body="Add someone you trust. No message is sent until you explicitly test or use a feature."
        >
          <Button className="primary" onClick={() => openForm()}>
            Add your first contact
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="feature-actions">
            <Button className="secondary" onClick={() => open("recipient")}>
              Preview what contacts receive
            </Button>
            <Button className="primary compact" onClick={() => openForm()}>
              + Add
            </Button>
          </div>
          {contacts.map((c) => (
            <article className="contact-detail" key={c.id}>
              <div className="contact-head">
                <span className="avatar">{initials(c.name)}</span>
                <div>
                  <h2>{c.name}</h2>
                  <p>
                    {c.relation} · {c.phone}
                  </p>
                </div>
                <a className="call-chip" href={telHref(c.phone)} aria-label={`Call ${c.name}`}>
                  Call
                </a>
              </div>
              <div className="role-chips">
                {c.roles.map((role) => (
                  <span key={role}>{role}</span>
                ))}
              </div>
              <p className="escalation">
                <b>Missed check-in:</b> {c.escalation}
              </p>
              <div className="row-actions">
                <Button onClick={() => sendTest(c)}>Send test</Button>
                <Button onClick={() => openForm(c)}>Edit</Button>
                <Button className="danger-link" onClick={() => remove(c)}>
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </>
      )}

      {formOpen && (
        <ContactFormModal editing={editing} contacts={contacts} onSave={save} onCancel={() => setFormOpen(false)} />
      )}
    </main>
  )
}
