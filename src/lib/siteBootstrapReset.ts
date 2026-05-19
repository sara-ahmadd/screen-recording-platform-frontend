import { clearBrowserCachesOnly } from "@/lib/clearSiteData";

/** Tracks which production build's caches were already cleared for this browser profile. */
const CACHE_VERSION_KEY = "app_cache_version";
const BUILD_ID = import.meta.env.VITE_BUILD_ID ?? import.meta.env.MODE ?? "development";

let bootstrapPromise: Promise<void> | null = null;

/**
 * On new deploys, clears service-worker and HTTP caches so users get fresh assets.
 * Does not clear localStorage, sessionStorage, or cookies (auth and preferences stay intact).
 */
export async function runSiteBootstrapReset(): Promise<void> {
  if (typeof window === "undefined") return;

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        const lastVersion = localStorage.getItem(CACHE_VERSION_KEY);
        if (lastVersion === BUILD_ID) return;

        await clearBrowserCachesOnly();
        localStorage.setItem(CACHE_VERSION_KEY, BUILD_ID);
      } catch {
        // Never block the app if cache APIs fail
      }
    })();
  }

  return bootstrapPromise;
}
