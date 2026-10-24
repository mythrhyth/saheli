import { AuthProvider, LoginScreen, useAuth } from "@/features/auth"
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow"
import { AppShell } from "./AppShell"
import { NavigationProvider } from "./navigation/NavigationProvider"
import { AppStateProvider } from "./state/AppStateProvider"
import { useAppState } from "./state/useAppState"
import { useDocumentPreferences } from "./useDocumentPreferences"

const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true"

/** Root component: providers, then auth gate, then onboarding or the main app. */
export default function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <NavigationProvider>
          <Root />
        </NavigationProvider>
      </AppStateProvider>
    </AuthProvider>
  )
}

function Root() {
  const { isAuthenticated } = useAuth()
  const { onboarded, displayPrefs } = useAppState()
  useDocumentPreferences(displayPrefs)

  // Allow skipping auth in demo/dev mode via VITE_SKIP_AUTH=true
  if (!SKIP_AUTH && !isAuthenticated) {
    return <LoginScreen />
  }

  return onboarded ? <AppShell /> : <OnboardingFlow />
}
