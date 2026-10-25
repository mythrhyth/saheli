import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import type { ScreenName } from "@/app/navigation/types"
import { useAppState } from "@/app/state/useAppState"
import { MapPreview } from "@/components/MapPreview"
import { Badge, Button, Icon, type IconName } from "@/components/ui"
import { CheckInChip } from "@/features/checkin/CheckInChip"
import { AlertCard } from "@/features/disaster/AlertCard"
import { SharingChip } from "@/features/sharing/SharingChip"
import { contactsStrictlyWithRole } from "@/lib/contacts"
import { greetingKey } from "@/lib/format"
import { RoutePlannerCard } from "./RoutePlannerCard"

const QUICK_ACTIONS: [icon: IconName, screen: ScreenName][] = [
  ["share", "share"],
  ["check", "checkin"],
  ["spark", "assistant"],
  ["download", "offline"],
]

/** Home tab. `onLogoTap` powers the discreet triple-tap SOS trigger. */
export default function HomeScreen({ onLogoTap }: { onLogoTap: () => void }) {
  const { t } = useTranslation()
  const { open, goTab } = useNavigation()
  const { contacts, profile, locationStatus } = useAppState()
  const sosCount = contactsStrictlyWithRole(contacts, "SOS recipient").length

  return (
    <main className="screen-content">
      <header className="topbar">
        <Button className="brand" onClick={onLogoTap} label={t("app")}>
          <span className="brandmark">
            <Icon name="shield" size={19} />
          </span>
          {t("app")}
        </Button>
        <Button className="icon-button" onClick={() => open("notifications")} label={t("notifications")}>
          <Icon name="bell" />
        </Button>
      </header>

      <SharingChip />
      <CheckInChip onClick={() => open("checkin")} />

      <section className="greeting">
        <p>
          {t(greetingKey())}
          {profile.name ? `, ${profile.name}` : ""}
        </p>
        <h1>{t("greeting")}</h1>
        <Button className="location" onClick={() => open("location")}>
          <Icon name="pin" size={15} /> {profile.city}{" "}
          <Badge tone={locationStatus === "granted" ? "ready" : ""}>
            {locationStatus === "granted" ? t("locationOn") : t("locationOff")}
          </Badge>
        </Button>
      </section>

      <AlertCard />

      <section className="sos-card">
        <div>
          <Badge tone={sosCount ? "ready" : ""}>
            {sosCount ? t("contactsReady", { count: sosCount }) : t("noContacts")}
          </Badge>
          <h2>{t("emergency")}</h2>
          <p>{t("emergencyHelp")}</p>
        </div>
        <Button className="sos-button" onClick={() => open("sos")} label="SOS">
          SOS
        </Button>
        <Button className="text-action" onClick={() => open("discreet")}>
          {t("discreet")}
          <Icon name="chevron" size={15} />
        </Button>
      </section>

      <RoutePlannerCard />

      <div className="section-heading">
        <h2>{t("quick")}</h2>
        <span>{t("essential")}</span>
      </div>
      <section className="quick-grid">
        {QUICK_ACTIONS.map(([icon, screen]) => (
          <Button className="quick-card" key={screen} onClick={() => open(screen)}>
            <span>
              <Icon name={icon} />
            </span>
            {t(screen)}
            <Icon name="chevron" size={15} />
          </Button>
        ))}
      </section>

      <section className="safety-preview">
        <MapPreview onClick={() => goTab("explore")} />
        <div className="preview-copy">
          <Badge tone="limited">{t("limited")}</Badge>
          <h3>Police Bazaar</h3>
          <p>{t("noGuarantee")}</p>
          <Button className="link" onClick={() => goTab("explore")}>
            {t("exploreArea")}
            <Icon name="chevron" />
          </Button>
        </div>
      </section>

      <Button className="tools-row" onClick={() => open("tools")}>
        <span>
          <Icon name="shield" />
          <span>
            <strong>{t("safetyTools")}</strong>
            <small>{t("safetyToolsSub")}</small>
          </span>
        </span>
        <Icon name="chevron" />
      </Button>
    </main>
  )
}
