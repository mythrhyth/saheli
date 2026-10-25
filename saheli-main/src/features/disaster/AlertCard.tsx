import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { Button, Icon } from "@/components/ui"

/** Official alert banner on Home (sample data until the alerts feed exists). */
export function AlertCard() {
  const { t } = useTranslation()
  const { open } = useNavigation()
  const { alertActive, dismissAlert } = useAppState()
  if (!alertActive) return null

  return (
    <section className="alert-card alert-expanded">
      <span className="alert-icon">
        <Icon name="alert" />
      </span>
      <span className="alert-copy">
        <strong>{t("alert")}</strong>
        <small>{t("alertMeta")}</small>
        <em>{t("sample")}</em>
      </span>
      <Button className="alert-dismiss" onClick={dismissAlert} label={t("dismiss")}>
        ×
      </Button>
      <Button className="link" onClick={() => open("disaster")}>
        {t("guidance")}
      </Button>
      <Button className="link critical-link" onClick={() => open("disaster", { focusCheckin: true })}>
        {t("disasterCheckin")}
      </Button>
    </section>
  )
}
