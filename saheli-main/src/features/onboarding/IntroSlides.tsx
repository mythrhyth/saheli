import { useTranslation } from "react-i18next"
import { Button, Icon } from "@/components/ui"
import { INTRO_SLIDE_ICONS as SLIDE_ICONS } from "./steps"

type IntroSlidesProps = { index: number; onNext: () => void; onSkip: () => void }

/** Three intro slides shown before setup. */
export function IntroSlides({ index, onNext, onSkip }: IntroSlidesProps) {
  const { t } = useTranslation()
  const n = index + 1
  const isLast = index === SLIDE_ICONS.length - 1

  return (
    <main className="onboarding">
      <div className="onboarding-top">
        <span className="brandmark">
          <Icon name="shield" />
        </span>
        <Button className="link" onClick={onSkip}>
          {t("skip")}
        </Button>
      </div>
      <div className={`intro-visual visual-${n}`}>
        <Icon name={SLIDE_ICONS[index]} size={48} />
      </div>
      <div>
        <span className="eyebrow">
          0{n} / 0{SLIDE_ICONS.length}
        </span>
        <h1>{t(`intro${n}Title`)}</h1>
        <p>{t(`intro${n}Body`)}</p>
      </div>
      <div className="flow-actions">
        <div className="progress">
          {SLIDE_ICONS.map((icon, i) => (
            <i className={i === index ? "active" : ""} key={icon} />
          ))}
        </div>
        <Button className="primary" onClick={onNext}>
          {isLast ? t("getStarted") : t("next")}
          <Icon name="chevron" />
        </Button>
      </div>
    </main>
  )
}
