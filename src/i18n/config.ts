import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
} from "./constants";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enLayout from "./locales/en/layout.json";
import enHome from "./locales/en/home.json";
import enDashboard from "./locales/en/dashboard.json";
import enBilling from "./locales/en/billing.json";
import enWorkspaces from "./locales/en/workspaces.json";
import enRecording from "./locales/en/recording.json";
import enProfile from "./locales/en/profile.json";
import enMarketing from "./locales/en/marketing.json";
import enBlogPosts from "./locales/en/blogPosts.json";
import enLegal from "./locales/en/legal.json";
import enAdmin from "./locales/en/admin.json";
import enErrors from "./locales/en/errors.json";
import enSeo from "./locales/en/seo.json";

import arCommon from "./locales/ar/common.json";
import arAuth from "./locales/ar/auth.json";
import arLayout from "./locales/ar/layout.json";
import arHome from "./locales/ar/home.json";
import arDashboard from "./locales/ar/dashboard.json";
import arBilling from "./locales/ar/billing.json";
import arWorkspaces from "./locales/ar/workspaces.json";
import arRecording from "./locales/ar/recording.json";
import arProfile from "./locales/ar/profile.json";
import arMarketing from "./locales/ar/marketing.json";
import arBlogPosts from "./locales/ar/blogPosts.json";
import arLegal from "./locales/ar/legal.json";
import arAdmin from "./locales/ar/admin.json";
import arErrors from "./locales/ar/errors.json";
import arSeo from "./locales/ar/seo.json";
import { syncDocumentLanguage } from "./syncDocumentLanguage";

const namespaces = [
  "common",
  "auth",
  "layout",
  "home",
  "dashboard",
  "billing",
  "workspaces",
  "recording",
  "profile",
  "marketing",
  "legal",
  "admin",
  "errors",
  "seo",
] as const;

export type AppNamespace = (typeof namespaces)[number];

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    layout: enLayout,
    home: enHome,
    dashboard: enDashboard,
    billing: enBilling,
    workspaces: enWorkspaces,
    recording: enRecording,
    profile: enProfile,
    marketing: { ...enMarketing, blogs: enBlogPosts },
    legal: enLegal,
    admin: enAdmin,
    errors: enErrors,
    seo: enSeo,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    layout: arLayout,
    home: arHome,
    dashboard: arDashboard,
    billing: arBilling,
    workspaces: arWorkspaces,
    recording: arRecording,
    profile: arProfile,
    marketing: { ...arMarketing, blogs: arBlogPosts },
    legal: arLegal,
    admin: arAdmin,
    errors: arErrors,
    seo: arSeo,
  },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: [...namespaces],
    defaultNS: "common",
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: ["en", "ar"],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
    saveMissing: false,
    missingKeyHandler: (lng, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing translation: ${lng}/${ns}:${key}`);
      }
      return key;
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

i18n.on("languageChanged", (lng) => {
  syncDocumentLanguage(normalizeLanguage(lng));
});

syncDocumentLanguage(normalizeLanguage(i18n.language));

export { i18n, namespaces };
export default i18n;
