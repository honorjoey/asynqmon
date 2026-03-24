import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "zh"],
    detection: {
      // Detect language from: localStorage first, then browser settings
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "asynqmon:language",
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
