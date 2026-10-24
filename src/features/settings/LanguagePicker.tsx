import { useTranslation } from "react-i18next"
import { Button, Icon } from "@/components/ui"
import { FULLY_TRANSLATED, LANGUAGES, STORAGE_KEYS } from "@/config/constants"

/** Language list used in onboarding and settings. */
export function LanguagePicker({ onContinue }: { onContinue?: () => void }) {
  const { t, i18n } = useTranslation()

  const choose = (code: string) => {
    void i18n.changeLanguage(code)
    localStorage.setItem(STORAGE_KEYS.language, code)
  }

  return (
    <main className="flow-screen">
      <span className="brandmark">
        <Icon name="shield" />
      </span>
      <div>
        <span className="eyebrow">{t("language")}</span>
        <h1>{t("chooseLanguage")}</h1>
        <p>{t("languageHelp")}</p>
      </div>
      <div className="choice-list">
        {LANGUAGES.map(([code, label]) => (
          <Button
            key={code}
            className={`choice-row ${i18n.language === code ? "active" : ""}`}
            onClick={() => choose(code)}
          >
            <span>
              {label}
              {!FULLY_TRANSLATED.includes(code) && <small className="partial-note">Partial translation</small>}
            </span>
            {i18n.language === code && <Icon name="check" />}
          </Button>
        ))}
      </div>
      {onContinue && (
        <Button className="primary" onClick={onContinue}>
          {t("continue")}
          <Icon name="chevron" />
        </Button>
      )}
    </main>
  )
}
