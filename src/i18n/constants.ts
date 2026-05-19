export const LANGUAGE_STORAGE_KEY = "app-language";

/** Keys kept when the user manually clears site data from profile (language + theme). */
export const PRESERVED_STORAGE_KEYS = [LANGUAGE_STORAGE_KEY, "theme"] as const;

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "en";
export const FALLBACK_LANGUAGE: AppLanguage = "en";

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === "en" || value === "ar";
}

export function normalizeLanguage(value: string | null | undefined): AppLanguage {
  if (isAppLanguage(value)) return value;
  if (value?.toLowerCase().startsWith("ar")) return "ar";
  return DEFAULT_LANGUAGE;
}

export function isRtlLanguage(lang: AppLanguage): boolean {
  return lang === "ar";
}
