import { useEffect, useState } from "react"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ScreenHeader } from "@/components/layout/ScreenLayout"
import { Button, EmptyState, Toast } from "@/components/ui"
import { useAuth } from "@/features/auth"
import { useToast } from "@/hooks/useToast"
import { api, ApiError } from "@/lib/api"
import { initials, telHref } from "@/lib/format"
import { queueMessage } from "@/lib/outbox"
import type { ContactFormData } from "@/lib/validation"
import type { Contact } from "@/types"
import { ContactFormModal } from "./ContactFormModal"

/** Contacts tab: manage trusted contacts, their roles and escalation. */
export default function ContactsScreen() {
  const { open } = useNavigation()
  const { contacts, setContacts, profile } = useAppState()
  const { isAuthenticated } = useAuth()
  const [editing, setEditing] = useState<Contact | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [toast, showToast] = useToast(5000)

  // On mount, sync contacts from the server if authenticated.
  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    setSyncLoading(true)

    api
      .get<Contact[]>("/contacts")
      .then((serverContacts) => {
        if (cancelled) return
        // Merge: server is source of truth; keep any local-only contacts (id not on server).
        const serverIds = new Set(serverContacts.map((c) => c.id))
        const localOnly = contacts.filter((c) => !serverIds.has(c.id))
        setContacts([...serverContacts, ...localOnly])
      })
      .catch((err) => {
        if (cancelled) return
        const msg = err instanceof ApiError ? err.message : "Could not sync with server"
        showToast(`${msg}. Using local contacts.`)
      })
      .finally(() => {
        if (!cancelled) setSyncLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const openForm = (contact: Contact | null = null) => {
    setEditing(contact)
    setFormOpen(true)
  }

  const save = async (data: ContactFormData) => {
    if (editing) {
      // Edit existing contact
      const optimistic = contacts.map((c) => (c.id === editing.id ? { ...c, ...data } : c))
      setContacts(optimistic)
      setFormOpen(false)

      if (isAuthenticated) {
        try {
          await api.put<Contact>(`/contacts/${editing.id}`, data)
        } catch {
          showToast("Could not sync with server — contact saved locally.")
        }
      }
    } else {
      // Add new contact — optimistic with a temporary local id
      const tempId = Date.now()
      const optimistic: Contact = { id: tempId, ...data }
      setContacts([...contacts, optimistic])
      setFormOpen(false)

      if (isAuthenticated) {
        try {
          const created = await api.post<Contact>("/contacts", data)
          // Replace temp id with real server id
          setContacts(contacts.map((c) => (c.id === tempId ? created : c)).concat(
            contacts.find((c) => c.id === tempId) ? [] : [created],
          ))
        } catch {
          showToast("Could not sync with server — contact saved locally.")
        }
      }
    }
  }

  const remove = async (contact: Contact) => {
    if (!confirm(`Remove ${contact.name}?`)) return

    setContacts(contacts.filter((c) => c.id !== contact.id))

    if (isAuthenticated) {
      try {
        await api.del(`/contacts/${contact.id}`)
      } catch {
        showToast("Could not sync with server — contact removed locally.")
      }
    }
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

  return (
    <main className="screen-content feature-page">
      <ScreenHeader title="Trusted contacts" eyebrow="SAHELI" />
      <Toast text={toast} />

      {syncLoading && (
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginBottom: 12 }}>
          Syncing contacts…
        </p>
      )}

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
