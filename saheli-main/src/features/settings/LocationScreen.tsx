import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Badge, Button, Icon } from "@/components/ui"

export default function LocationScreen() {
  const { t } = useTranslation()
  const { back } = useNavigation()
  const { locationStatus: status, requestLocation } = useAppState()
  const [busy, setBusy] = useState(false)

  const request = async () => {
    setBusy(true)
    await requestLocation()
    setBusy(false)
  }

  return (
    <ScreenLayout title={t("permission")} onBack={back}>
      <div className="feature-hero">
        <span className="setup-icon">
          <Icon name="pin" />
        </span>
        <h2>{t("locationTitle")}</h2>
        <p>{t("locationBody")}</p>
        <Badge tone={status === "granted" ? "ready" : "limited"}>
          {status === "granted" ? t("locationOn") : status}
        </Badge>
        {status === "denied" && <p className="permission-message">{t("denied")}</p>}
        {status === "unavailable" && <p className="permission-message">{t("unavailable")}</p>}
      </div>
      <Button className="primary" disabled={busy} onClick={() => void request()}>
        {busy ? "…" : status === "granted" ? t("checkAgain") : t("allowLocation")}
      </Button>
    </ScreenLayout>
  )
}
