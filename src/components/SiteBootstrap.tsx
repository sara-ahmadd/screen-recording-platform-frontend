import { useEffect, type ReactNode } from "react";
import { runSiteBootstrapReset } from "@/lib/siteBootstrapReset";

/**
 * Runs deploy cache busting in the background without blocking render.
 */
export default function SiteBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    void runSiteBootstrapReset();
  }, []);

  return <>{children}</>;
}
