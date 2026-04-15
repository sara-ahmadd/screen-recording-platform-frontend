import { useMemo } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_ORIGIN = new URL(API_BASE_URL).origin;

export function buildAvatarSrc(rawUrl?: string | null) {
  if (!rawUrl) return "";

  try {
    if (rawUrl.startsWith("/")) {
      if (rawUrl.startsWith("/__avatar_proxy/")) {
        return `${API_ORIGIN}${rawUrl.replace("/__avatar_proxy", "")}`;
      }
      return `${API_ORIGIN}${rawUrl}`;
    }

    const parsed = new URL(rawUrl);
    if (parsed.pathname.startsWith("/__avatar_proxy/")) {
      return `${API_ORIGIN}${parsed.pathname.replace("/__avatar_proxy", "")}${parsed.search}`;
    }

    if (parsed.origin === API_ORIGIN) {
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

export function useAvatarSrc(rawUrl?: string | null) {
  return useMemo(() => {
    return buildAvatarSrc(rawUrl);
  }, [rawUrl]);
}
