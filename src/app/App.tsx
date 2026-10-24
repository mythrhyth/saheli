import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow"
import { AppShell } from "./AppShell"
import { NavigationProvider } from "./navigation/NavigationProvider"
import { AppStateProvider } from "./state/AppStateProvider"
import { useAppState } from "./state/useAppState"
import { useDocumentPreferences } from "./useDocumentPreferences"

/** Root component: providers, then onboarding or the main app. */
export default function App() {
  return (
    <AppStateProvider>
      <NavigationProvider>
        <Root />
      </NavigationProvider>
    </AppStateProvider>
  )
}

function Root() {
  const { onboarded, displayPrefs } = useAppState()
  useDocumentPreferences(displayPrefs)
  return onboarded ? <AppShell /> : <OnboardingFlow />
}
