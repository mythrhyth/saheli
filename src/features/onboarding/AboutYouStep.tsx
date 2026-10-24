import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAppState } from "@/app/state/useAppState"
import { Button, Icon } from "@/components/ui"
import { defaultProfile } from "@/config/defaults"

/** Collects the user's name and city (both optional). */
export function AboutYouStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()
  const { profile, setProfile } = useAppState()
  const [name, setName] = useState(profile.name)
  const [city, setCity] = useState(profile.city)

  const save = () => {
    setProfile({ ...profile, name: name.trim(), city: city.trim() || defaultProfile.city })
    onNext()
  }

  return (
    <main className="onboarding setup-flow">
      <div className="onboarding-top">
        <span className="brandmark">
          <Icon name="shield" />
        </span>
      </div>
      <div className="setup-icon">
        <Icon name="user" size={34} />
      </div>
      <div>
        <span className="eyebrow">{t("setup")}</span>
        <h1>{t("aboutYou")}</h1>
        <p>{t("aboutYouBody")}</p>
        <label className="field">
          {t("yourName")}
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ananya"
            autoFocus
          />
        </label>
        <label className="field">
          {t("yourCity")}
          <input value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>
      <div className="flow-actions">
        <Button className="primary" onClick={save}>
          {t("continue")}
          <Icon name="chevron" />
        </Button>
      </div>
    </main>
  )
}
