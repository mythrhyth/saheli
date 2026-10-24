import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui"
import { defaultProfile } from "@/config/defaults"
import { INDIAN_MOBILE } from "@/lib/validation"
import type { Profile } from "@/types"

type EditProfileModalProps = { profile: Profile; onSave: (profile: Profile) => void; onCancel: () => void }

export function EditProfileModal({ profile, onSave, onCancel }: EditProfileModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(profile)
  const [phoneError, setPhoneError] = useState("")

  const submit = () => {
    const phone = form.phone.trim()
    if (phone && !INDIAN_MOBILE.test(phone)) {
      setPhoneError("Use a valid Indian mobile number")
      return
    }
    onSave({ name: form.name.trim(), city: form.city.trim() || defaultProfile.city, phone })
  }

  return (
    <div className="modal-backdrop">
      <form
        className="modal contact-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="modal-head">
          <h2>{t("editProfile")}</h2>
          <Button className="close" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </div>
        <label>
          {t("yourName")}
          <input
            value={form.name}
            maxLength={40}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </label>
        <label>
          {t("yourCity")}
          <input value={form.city} maxLength={60} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </label>
        <label>
          {t("yourPhone")}
          <input
            value={form.phone}
            inputMode="tel"
            placeholder="+91 98xxxxxxxx"
            onChange={(e) => {
              setForm({ ...form, phone: e.target.value })
              setPhoneError("")
            }}
          />
        </label>
        {phoneError && <small className="field-error">{phoneError}</small>}
        <small className="field-hint">{t("phoneHint")}</small>
        <Button type="submit" className="primary">
          {t("save")}
        </Button>
      </form>
    </div>
  )
}
