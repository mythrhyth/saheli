import { useState } from "react"
import { useAppState } from "@/app/state/useAppState"
import { LanguagePicker } from "@/features/settings/LanguagePicker"
import { AboutYouStep } from "./AboutYouStep"
import { IntroSlides } from "./IntroSlides"
import { SetupStep } from "./SetupStep"
import { INTRO_SLIDE_ICONS, SETUP_STEPS } from "./steps"

/**
 * First-run flow: intro slides → language → about you → six setup steps.
 * `page` walks through these in order.
 */
const LANGUAGE_PAGE = INTRO_SLIDE_ICONS.length
const ABOUT_PAGE = LANGUAGE_PAGE + 1
const FIRST_SETUP_PAGE = ABOUT_PAGE + 1

export function OnboardingFlow() {
  const { completeOnboarding } = useAppState()
  const [page, setPage] = useState(0)
  const next = () => setPage((p) => p + 1)

  let content
  if (page < LANGUAGE_PAGE) content = <IntroSlides index={page} onNext={next} onSkip={() => setPage(LANGUAGE_PAGE)} />
  else if (page === LANGUAGE_PAGE) content = <LanguagePicker onContinue={next} />
  else if (page === ABOUT_PAGE) content = <AboutYouStep onNext={next} />
  else {
    const index = page - FIRST_SETUP_PAGE
    const isLast = index === SETUP_STEPS.length - 1
    content = (
      <SetupStep key={index} index={index} onNext={isLast ? completeOnboarding : next} onSkipAll={completeOnboarding} />
    )
  }

  return (
    <div className="app-shell">
      <div className="phone onboarding-phone">{content}</div>
    </div>
  )
}
