import { useEffect, useState, type ReactNode } from "react";
import { runSiteBootstrapReset, SITE_RESET_SESSION_KEY } from "@/lib/siteBootstrapReset";

function isSiteResetDone(): boolean {
  return typeof window !== "undefined" && sessionStorage.getItem(SITE_RESET_SESSION_KEY) === "1";
}

/**
 * Runs async cache/service-worker cleanup once per tab session before rendering the app.
 * Sync storage is already cleared in index.html; this handles PWA caches and IndexedDB.
 */
export default function SiteBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => typeof window === "undefined" || isSiteResetDone());

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    void runSiteBootstrapReset().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) return null;
  return <>{children}</>;
}
