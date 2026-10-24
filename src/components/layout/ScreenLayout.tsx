import { useEffect, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui"
import { speak } from "@/lib/device"

type ScreenLayoutProps = {
  title: string
  children: ReactNode
  /** Shows a back button when provided. */
  onBack?: () => void
  eyebrow?: string
  className?: string
}

/** Standard page layout for stacked screens: back button, eyebrow, title, content. */
export function ScreenLayout({ title, children, onBack, eyebrow, className = "flow-page" }: ScreenLayoutProps) {
  const { t } = useTranslation()

  useEffect(() => {
    speak(title)
  }, [title])

  return (
    <main className={`screen-content ${className}`}>
      <ScreenHeader title={title} onBack={onBack} eyebrow={eyebrow ?? t("app")} />
      {children}
    </main>
  )
}

export function ScreenHeader({ title, onBack, eyebrow }: { title: string; onBack?: () => void; eyebrow: string }) {
  const { t } = useTranslation()
  return (
    <header className="flow-header">
      {onBack && (
        <Button className="icon-button" onClick={onBack} label={t("back")}>
          <span aria-hidden="true">←</span>
        </Button>
      )}
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
    </header>
  )
}
