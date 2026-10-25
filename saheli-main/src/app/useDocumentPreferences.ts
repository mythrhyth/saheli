import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { DisplayPrefs } from "@/types"

/** Applies theme, text size, motion and language to <html> so CSS can react to them. */
export function useDocumentPreferences(prefs: DisplayPrefs) {
  const { t, i18n } = useTranslation()
  const root = document.documentElement

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      root.dataset.theme = prefs.theme === "system" ? (media.matches ? "dark" : "light") : prefs.theme
    }
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [prefs.theme, root])

  useEffect(() => {
    root.dataset.text = prefs.textSize
    root.dataset.simple = String(prefs.simplified)
    root.dataset.motion = String(prefs.reduceMotion)
  }, [prefs.textSize, prefs.simplified, prefs.reduceMotion, root])

  useEffect(() => {
    root.lang = i18n.language
    document.title = t("app")
  }, [i18n.language, t, root])
}
