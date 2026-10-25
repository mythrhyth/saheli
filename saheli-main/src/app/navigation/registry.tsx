import type { ComponentType } from "react"
import type { IconName } from "@/components/ui"
import AssistantScreen from "@/features/assistant/AssistantScreen"
import CheckInScreen from "@/features/checkin/CheckInScreen"
import ContactsScreen from "@/features/contacts/ContactsScreen"
import RecipientPreviewScreen from "@/features/contacts/RecipientPreviewScreen"
import DisasterScreen from "@/features/disaster/DisasterScreen"
import ExploreScreen from "@/features/explore/ExploreScreen"
import AssessmentScreen from "@/features/journeys/AssessmentScreen"
import JourneysScreen from "@/features/journeys/JourneysScreen"
import RoutePlanningScreen from "@/features/journeys/RoutePlanningScreen"
import PrivacyScreen from "@/features/privacy/PrivacyScreen"
import ProfileScreen from "@/features/profile/ProfileScreen"
import AboutScreen from "@/features/settings/AboutScreen"
import AccessibilityScreen from "@/features/settings/AccessibilityScreen"
import EmergencyPrefsScreen from "@/features/settings/EmergencyPrefsScreen"
import HelpScreen from "@/features/settings/HelpScreen"
import JourneyDefaultsScreen from "@/features/settings/JourneyDefaultsScreen"
import LanguageScreen from "@/features/settings/LanguageScreen"
import LocationScreen from "@/features/settings/LocationScreen"
import NotificationsScreen from "@/features/settings/NotificationsScreen"
import SettingsScreen from "@/features/settings/SettingsScreen"
import LiveSharingScreen from "@/features/sharing/LiveSharingScreen"
import DiscreetSosScreen from "@/features/sos/DiscreetSosScreen"
import SosScreen from "@/features/sos/SosScreen"
import DigitalSafetyScreen from "@/features/tools/DigitalSafetyScreen"
import OfflineScreen from "@/features/tools/OfflineScreen"
import ReportConcernScreen from "@/features/tools/ReportConcernScreen"
import ShelterFinderScreen from "@/features/tools/ShelterFinderScreen"
import ToolsScreen from "@/features/tools/ToolsScreen"
import type { ScreenName, TabName } from "./types"

/** Every stacked screen, keyed by name. Add new screens here and to `ScreenName`. */
export const SCREENS: Record<ScreenName, ComponentType> = {
  sos: SosScreen,
  discreet: DiscreetSosScreen,
  checkin: CheckInScreen,
  share: LiveSharingScreen,
  route: RoutePlanningScreen,
  assessment: AssessmentScreen,
  assistant: AssistantScreen,
  tools: ToolsScreen,
  digital: DigitalSafetyScreen,
  report: ReportConcernScreen,
  shelter: ShelterFinderScreen,
  offline: OfflineScreen,
  disaster: DisasterScreen,
  privacy: PrivacyScreen,
  recipient: RecipientPreviewScreen,
  settings: SettingsScreen,
  language: LanguageScreen,
  accessibility: AccessibilityScreen,
  notifications: NotificationsScreen,
  emergency: EmergencyPrefsScreen,
  defaults: JourneyDefaultsScreen,
  location: LocationScreen,
  help: HelpScreen,
  about: AboutScreen,
}

/** Bottom-navigation tabs, in display order. Home is rendered separately (it needs the logo-tap handler). */
export const TABS: { id: TabName; icon: IconName; labelKey: string }[] = [
  { id: "home", icon: "home", labelKey: "home" },
  { id: "explore", icon: "map", labelKey: "explore" },
  { id: "journeys", icon: "route", labelKey: "journeys" },
  { id: "contacts", icon: "users", labelKey: "contacts" },
  { id: "profile", icon: "user", labelKey: "profile" },
]

export const TAB_SCREENS: Record<Exclude<TabName, "home">, ComponentType> = {
  explore: ExploreScreen,
  journeys: JourneysScreen,
  contacts: ContactsScreen,
  profile: ProfileScreen,
}
