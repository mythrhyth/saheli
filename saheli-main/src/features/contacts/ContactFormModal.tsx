import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui"
import { DEFAULT_ESCALATION, ESCALATIONS, ROLES } from "@/config/constants"
import { normalizePhone } from "@/lib/format"
import { contactSchema, type ContactFormData } from "@/lib/validation"
import type { Contact } from "@/types"

type ContactFormModalProps = {
  /** Contact being edited, or null to add a new one. */
  editing: Contact | null
  contacts: Contact[]
  onSave: (data: ContactFormData) => void
  onCancel: () => void
}

export function ContactFormModal({ editing, contacts, onSave, onCancel }: ContactFormModalProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          relation: editing.relation,
          phone: editing.phone,
          roles: editing.roles,
          escalation: editing.escalation,
        }
      : { name: "", relation: "", phone: "", roles: ["SOS recipient"], escalation: DEFAULT_ESCALATION },
  })

  const submit = (data: ContactFormData) => {
    const duplicate = contacts.some(
      (c) => c.id !== editing?.id && normalizePhone(c.phone) === normalizePhone(data.phone),
    )
    if (duplicate) {
      setError("phone", { message: "This number is already saved for another contact" })
      return
    }
    onSave(data)
  }

  return (
    <div className="modal-backdrop">
      <form className="modal contact-form" onSubmit={handleSubmit(submit)}>
        <div className="modal-head">
          <h2>{editing ? "Edit contact" : "Add contact"}</h2>
          <Button className="close" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <label>
          Name
          <input {...register("name")} autoFocus />
        </label>
        {errors.name && <small className="field-error">{errors.name.message}</small>}

        <label>
          Relationship
          <input {...register("relation")} />
        </label>
        {errors.relation && <small className="field-error">{errors.relation.message}</small>}

        <label>
          Indian mobile number
          <input {...register("phone")} inputMode="tel" placeholder="+91 98xxxxxxxx" />
        </label>
        {errors.phone && <small className="field-error">{errors.phone.message}</small>}

        <fieldset>
          <legend>Roles</legend>
          {ROLES.map((role) => (
            <label className="check-row" key={role}>
              <input type="checkbox" value={role} {...register("roles")} />
              <span>{role}</span>
            </label>
          ))}
        </fieldset>
        {errors.roles && <small className="field-error">{errors.roles.message}</small>}

        <label>
          Missed check-in escalation
          <select {...register("escalation")}>
            {ESCALATIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <Button className="primary" type="submit">
          Save contact
        </Button>
      </form>
    </div>
  )
}
