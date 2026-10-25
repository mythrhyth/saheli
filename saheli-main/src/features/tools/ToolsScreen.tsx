import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import type { ScreenName } from "@/app/navigation/types"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Button, Icon, type IconName } from "@/components/ui"

/** Hub listing all safety tools. */
export default function ToolsScreen() {
  const { t } = useTranslation()
  const { open, back } = useNavigation()

  const tools: [screen: ScreenName, icon: IconName, title: string, description: string][] = [
    ["digital", "shield", t("digital"), "Guides, security checklist, evidence log"],
    ["report", "alert", t("report"), "Anonymous by default, shown as unverified"],
    ["shelter", "home", t("shelter"), "Confirmed, reported and unknown shelters"],
    ["discreet", "lock", t("discreet"), "Silent triggers and fake call"],
    ["offline", "download", t("offline"), "Numbers and guidance without internet"],
    ["help", "phone", "Helplines", "112, 181, 1091, 1930 and more"],
  ]

  return (
    <ScreenLayout title={t("safetyTools")} onBack={back}>
      {tools.map(([screen, icon, title, description]) => (
        <Button className="list-row" key={screen} onClick={() => open(screen)}>
          <span className="list-icon">
            <Icon name={icon} />
          </span>
          <span>
            <strong>{title}</strong>
            <small>{description}</small>
          </span>
          <Icon name="chevron" />
        </Button>
      ))}
    </ScreenLayout>
  )
}
