import { clearBrowserSiteData } from "@/lib/clearSiteData";
import { normalizeLanguage, PRESERVED_STORAGE_KEYS } from "@/i18n/constants";

/** Set after a successful reset for the current browser tab session. */
export const SITE_RESET_SESSION_KEY = "site_data_reset_done";

/**
 * Runs once per tab session when the app loads: clears caches, service workers,
 * IndexedDB, cookies (script-visible), and web storage while keeping language
 * and theme preferences.
 */
export async function runSiteBootstrapReset(): Promise<void> {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(SITE_RESET_SESSION_KEY) === "1") return;

  await clearBrowserSiteData({ preserveKeys: [...PRESERVED_STORAGE_KEYS] });

  sessionStorage.setItem(SITE_RESET_SESSION_KEY, "1");

  try {
    const { default: i18n } = await import("@/i18n/config");
    const lang = normalizeLanguage(localStorage.getItem("app-language") ?? i18n.language);
    if (i18n.language !== lang) {
      await i18n.changeLanguage(lang);
    }
    const { syncDocumentLanguage } = await import("@/i18n/syncDocumentLanguage");
    syncDocumentLanguage(lang);
  } catch {
    // i18n optional during SSR or failed init
  }
}
