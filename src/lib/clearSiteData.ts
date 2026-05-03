/**
 * Best-effort removal of client-side data for this origin: Cache Storage,
 * service workers, IndexedDB, session/local storage, and JavaScript-visible cookies.
 *
 * HttpOnly cookies cannot be cleared from script; the server session may persist until expiry or logout.
 */

function clearSameOriginScriptCookies(): void {
  if (typeof document === "undefined") return;
  const hostname = window.location.hostname;
  const basePaths = ["/"];
  if (window.location.pathname && window.location.pathname !== "/") {
    basePaths.push(window.location.pathname);
  }

  const domains = new Set<string>();
  domains.add(hostname);
  if (hostname.startsWith("www.")) {
    domains.add(hostname.slice(4));
    domains.add(`.${hostname.slice(4)}`);
  }
  domains.add(`.${hostname}`);

  const pairs = document.cookie.split(";").filter(Boolean);
  const names = new Set<string>();
  for (const pair of pairs) {
    const name = pair.split("=")[0]?.trim();
    if (name) names.add(name);
  }

  const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
  for (const name of names) {
    for (const path of basePaths) {
      document.cookie = `${name}=;expires=${expire};path=${path}`;
      for (const domain of domains) {
        document.cookie = `${name}=;expires=${expire};path=${path};domain=${domain}`;
      }
    }
  }
}

async function clearServiceWorkers(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    // ignore
  }
}

async function clearCacheStorage(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {
    // ignore
  }
}

async function clearIndexedDatabases(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    if (typeof indexedDB.databases !== "function") return;
    const dbs = await indexedDB.databases();
    for (const db of dbs || []) {
      if (!db?.name) continue;
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(db.name!);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    }
  } catch {
    // ignore
  }
}

function clearWebStorages(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.clear();
  } catch {
    // ignore
  }
  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }
}

/**
 * Clears PWA/service worker caches, storage, and script-readable cookies for the current origin.
 * Call after logging out if you still need the server to invalidate the session.
 */
export async function clearBrowserSiteData(): Promise<void> {
  if (typeof window === "undefined") return;

  await clearServiceWorkers();
  await clearCacheStorage();
  await clearIndexedDatabases();
  clearSameOriginScriptCookies();
  clearWebStorages();
}
