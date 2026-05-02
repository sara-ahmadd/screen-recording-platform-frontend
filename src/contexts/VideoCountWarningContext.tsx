import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/lib/socket";
import { notificationsApi } from "@/lib/api";
import { subscribeNotificationsUpdated } from "@/lib/notificationsSync";

const SESSION_DISMISS_KEY = "therec:videoCountWarning:dismissSession";
const IDS_DISMISS_KEY = "therec:videoCountWarning:dismissedIds";

const VIDEOS_COUNT_WARNING_TITLE = "videos count warning";

type BannerPayload = {
  id?: number;
  title: string;
  message: string;
};

type VideoCountWarningContextValue = {
  banner: BannerPayload | null;
  dismiss: () => void;
};

const VideoCountWarningContext = createContext<VideoCountWarningContextValue | null>(null);

function normalizeNotificationsList(response: unknown): Record<string, unknown>[] {
  const r = response as {
    notifications?: unknown;
    data?: { notifications?: unknown; length?: number } | unknown[];
  } | null;
  if (!r) return [];
  if (Array.isArray(r.notifications)) return r.notifications as Record<string, unknown>[];
  if (r.data && typeof r.data === "object" && "notifications" in r.data && Array.isArray((r.data as { notifications: unknown }).notifications)) {
    return (r.data as { notifications: Record<string, unknown>[] }).notifications;
  }
  if (Array.isArray(r.data)) return r.data as Record<string, unknown>[];
  if (Array.isArray(response)) return response as Record<string, unknown>[];
  return [];
}

function extractNotificationFields(raw: unknown): BannerPayload | null {
  if (raw == null) return null;
  const payload = typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!payload) return null;
  const nested =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : null;
  const idRaw = payload.id ?? payload.notificationId ?? nested?.id;
  const idNum = Number(idRaw);
  const id = Number.isFinite(idNum) && idNum > 0 ? idNum : undefined;
  const title = String(
    payload.title ?? payload.notificationTitle ?? nested?.title ?? nested?.notificationTitle ?? "",
  ).trim();
  const message = String(
    payload.message ??
      payload.description ??
      payload.body ??
      nested?.message ??
      nested?.description ??
      nested?.body ??
      "",
  ).trim();
  if (!title) return null;
  return { id, title, message };
}

function isVideosCountWarningTitle(title: string) {
  return title.trim().toLowerCase() === VIDEOS_COUNT_WARNING_TITLE;
}

function readDismissedIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(IDS_DISMISS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  } catch {
    return [];
  }
}

export function VideoCountWarningProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [banner, setBanner] = useState<BannerPayload | null>(null);

  const isDismissedFor = useCallback((id?: number) => {
    if (typeof window === "undefined") return true;
    if (sessionStorage.getItem(SESSION_DISMISS_KEY) === "1") return true;
    if (id != null) {
      const ids = readDismissedIds();
      if (ids.includes(id)) return true;
    }
    return false;
  }, []);

  const tryShowBanner = useCallback(
    (payload: BannerPayload) => {
      if (!isVideosCountWarningTitle(payload.title)) return;
      if (isDismissedFor(payload.id)) return;
      setBanner({
        id: payload.id,
        title: payload.title.trim(),
        message: payload.message,
      });
    },
    [isDismissedFor],
  );

  const scanNotificationsList = useCallback(
    (list: Record<string, unknown>[]) => {
      for (const n of list) {
        const title = String(n.title ?? n.notificationTitle ?? "").trim();
        if (!isVideosCountWarningTitle(title)) continue;
        const idRaw = n.id ?? n.notificationId;
        const idNum = Number(idRaw);
        const id = Number.isFinite(idNum) && idNum > 0 ? idNum : undefined;
        if (isDismissedFor(id)) continue;
        const message = String(n.message ?? n.description ?? n.body ?? "").trim();
        tryShowBanner({ id, title, message });
        break;
      }
    },
    [isDismissedFor, tryShowBanner],
  );

  useEffect(() => {
    if (!user || loading) {
      setBanner(null);
      return;
    }

    const socket = getSocket();

    const onPayload = (...args: unknown[]) => {
      const parsed = extractNotificationFields(args[0]);
      if (parsed) tryShowBanner(parsed);
    };

    socket.on("notification", onPayload);
    socket.on("new_notification", onPayload);
    socket.on("notification_created", onPayload);

    const onLimitWarning = (data: unknown) => {
      const parsed = extractNotificationFields(data);
      if (parsed) tryShowBanner(parsed);
    };
    socket.on("limit_warning", onLimitWarning);

    return () => {
      socket.off("notification", onPayload);
      socket.off("new_notification", onPayload);
      socket.off("notification_created", onPayload);
      socket.off("limit_warning", onLimitWarning);
    };
  }, [user, loading, tryShowBanner]);

  useEffect(() => {
    if (!user || loading) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await notificationsApi.getAll({ page: 1, limit: 40, order: "DESC" });
        if (cancelled) return;
        scanNotificationsList(normalizeNotificationsList(res));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, scanNotificationsList]);

  useEffect(() => {
    if (!user) return;
    return subscribeNotificationsUpdated((detail) => {
      if (detail?.notifications?.length) {
        scanNotificationsList(detail.notifications as Record<string, unknown>[]);
      }
    });
  }, [user, scanNotificationsList]);

  const dismiss = useCallback(() => {
    setBanner((current) => {
      if (current?.id != null) {
        const ids = readDismissedIds();
        if (!ids.includes(current.id)) {
          ids.push(current.id);
          sessionStorage.setItem(IDS_DISMISS_KEY, JSON.stringify(ids));
        }
      } else {
        sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
      }
      return null;
    });
  }, []);

  const value = useMemo(() => ({ banner, dismiss }), [banner, dismiss]);

  return (
    <VideoCountWarningContext.Provider value={value}>{children}</VideoCountWarningContext.Provider>
  );
}

export function useVideoCountWarning() {
  const ctx = useContext(VideoCountWarningContext);
  if (!ctx) {
    throw new Error("useVideoCountWarning must be used within VideoCountWarningProvider");
  }
  return ctx;
}
