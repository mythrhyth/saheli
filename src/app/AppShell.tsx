import { useTranslation } from "react-i18next"
import { Button, Icon } from "@/components/ui"
import { useCheckInEngine } from "@/features/checkin/useCheckIn"
import HomeScreen from "@/features/home/HomeScreen"
import { useDiscreetTriggers } from "@/features/sos/useDiscreetTriggers"
import { useNavigation } from "./navigation/useNavigation"
import { SCREENS, TABS, TAB_SCREENS } from "./navigation/registry"
import { useAppState } from "./state/useAppState"

/** Main layout after onboarding: the active tab with bottom navigation, or the top stacked screen. */
export function AppShell() {
  const { t } = useTranslation()
  const { tab, current, goTab } = useNavigation()
  const { contacts, profile } = useAppState()

  // Background behaviour that must run regardless of the visible screen.
  useCheckInEngine(contacts, profile)
  const onLogoTap = useDiscreetTriggers(contacts, profile)

  if (current) {
    const Screen = SCREENS[current.name]
    return (
      <div className="app-shell">
        <div className="phone">
          <div className="overlay-page" key={current.name}>
            <Screen />
          </div>
        </div>
      </div>
    )
  }

  const TabScreen = tab === "home" ? null : TAB_SCREENS[tab]

  return (
    <div className="app-shell">
      <div className="phone">
        {TabScreen ? <TabScreen /> : <HomeScreen onLogoTap={onLogoTap} />}
        <nav className="bottom-nav" aria-label="Main">
          {TABS.map(({ id, icon, labelKey }) => (
            <Button key={id} className={tab === id ? "selected" : ""} onClick={() => goTab(id)}>
              <Icon name={icon} />
              <span>{t(labelKey)}</span>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  )
}
