import { useTranslation } from "react-i18next"
import { useNavigation } from "@/app/navigation/useNavigation"
import { useAppState } from "@/app/state/useAppState"
import { ScreenLayout } from "@/components/layout/ScreenLayout"
import { Segmented, SettingToggle } from "@/components/ui"
import { speakNow } from "@/lib/device"
import type { TextSize } from "@/types"

const TEXT_SIZES: TextSize[] = ["normal", "large"]

export default function AccessibilityScreen() {
  const { t } = useTranslation()
  const { back } = useNavigation()
  const { displayPrefs: prefs, setDisplayPrefs: setPrefs } = useAppState()

  return (
    <ScreenLayout title={t("accessibility")} onBack={back}>
      <section className="setting-block">
        <strong>{t("textSize")}</strong>
        <Segmented
          label={t("textSize")}
          options={TEXT_SIZES.map((size) => [size, t(size)] as [TextSize, string])}
          value={prefs.textSize}
          set={(textSize) => setPrefs({ ...prefs, textSize })}
        />
      </section>
      <SettingToggle
        title={t("simplified")}
        sub={t("simplifiedSub")}
        value={prefs.simplified}
        set={(simplified) => setPrefs({ ...prefs, simplified })}
      />
      <SettingToggle
        title={t("reduceMotion")}
        value={prefs.reduceMotion}
        set={(reduceMotion) => setPrefs({ ...prefs, reduceMotion })}
      />
      <SettingToggle
        title={t("voice")}
        sub={t("voiceSub")}
        value={prefs.voice}
        set={(voice) => {
          setPrefs({ ...prefs, voice })
          if (voice) speakNow(t("voiceOnMessage"))
        }}
      />
    </ScreenLayout>
  )
}
