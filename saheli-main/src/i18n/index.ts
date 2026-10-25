import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { STORAGE_KEYS } from "@/config/constants"
import en from "./locales/en"
import hi from "./locales/hi"
import { bn, garo, kha, ne } from "./locales/partial"

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    bn: { translation: bn },
    ne: { translation: ne },
    kha: { translation: kha },
    garo: { translation: garo },
  },
  lng: localStorage.getItem(STORAGE_KEYS.language) || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n
