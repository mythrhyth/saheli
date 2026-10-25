import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { Button } from "@/components/ui"
import { LanguagePicker } from "./LanguagePicker"

export default function LanguageScreen() {
  const { t } = useTranslation()
  const { back } = useNavigation()
  return (
    <div className="subscreen">
      <Button className="back-link" onClick={back}>
        ← {t("back")}
      </Button>
      <LanguagePicker />
    </div>
  )
}
