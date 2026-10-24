import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import type { ScreenName } from "@/app/navigation/types"
import { useAppState } from "@/app/state/useAppState"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Button, Icon, Segmented } from "@/components/ui"
import type { Theme } from "@/types"

const LINKS: [labelKey: string, screen: ScreenName][] = [
  ["language", "language"],
  ["notifications", "notifications"],
  ["accessibility", "accessibility"],
  ["emergencyPrefs", "emergency"],
  ["journeyDefaults", "defaults"],
  ["privacy", "privacy"],
  ["help", "help"],
  ["about", "about"],
]
const THEMES: Theme[] = ["light", "dark", "system"]

export default function SettingsScreen() {
  const { t } = useTranslation()
  const { open, back } = useNavigation()
  const { displayPrefs, setDisplayPrefs, resetAllData } = useAppState()

  const reset = () => {
    if (confirm(t("resetConfirm"))) resetAllData()
  }

  return (
    <ScreenLayout title={t("settings")} onBack={back}>
      <section className="setting-block">
        <strong>{t("appearance")}</strong>
        <Segmented
          label={t("appearance")}
          options={THEMES.map((theme) => [theme, t(theme)] as [Theme, string])}
          value={displayPrefs.theme}
          set={(theme) => setDisplayPrefs({ ...displayPrefs, theme })}
        />
      </section>
      {LINKS.map(([labelKey, screen]) => (
        <Button className="list-row" key={labelKey} onClick={() => open(screen)}>
          <span>
            <strong>{t(labelKey)}</strong>
          </span>
          <Icon name="chevron" />
        </Button>
      ))}
      <Button className="reset-button" onClick={reset}>
        {t("reset")}
      </Button>
    </ScreenLayout>
  )
}
