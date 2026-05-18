import { useEffect, useRef } from "react";
import { clearBrowserSiteData } from "@/lib/clearSiteData";
import { PRESERVED_STORAGE_KEYS } from "@/i18n/constants";
import i18n from "@/i18n/config";
import { normalizeLanguage } from "@/i18n/constants";

const HOME_RESET_FLAG = "home_site_reset_v1";

/**
 * On first home page visit per tab session, clears origin storage/cache while
 * preserving language and theme, then re-applies i18n from restored preference.
 */
export function useHomePageSiteReset(enabled = true) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (startedRef.current) return;
    startedRef.current = true;

    if (sessionStorage.getItem(HOME_RESET_FLAG) === "1") return;

    const run = async () => {
      const preserved: Record<string, string> = {};
      for (const key of PRESERVED_STORAGE_KEYS) {
        const value = window.localStorage.getItem(key);
        if (value != null) preserved[key] = value;
      }

      await clearBrowserSiteData({ preserveKeys: [...PRESERVED_STORAGE_KEYS] });

      for (const [key, value] of Object.entries(preserved)) {
        window.localStorage.setItem(key, value);
      }

      const lang = normalizeLanguage(preserved["app-language"] ?? i18n.language);
      if (i18n.language !== lang) {
        await i18n.changeLanguage(lang);
      }

      sessionStorage.setItem(HOME_RESET_FLAG, "1");
    };

    void run();
  }, [enabled]);
}
