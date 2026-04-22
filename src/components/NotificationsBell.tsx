import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsApi, recordingsApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { emitNotificationsUpdated, subscribeNotificationsUpdated } from "@/lib/notificationsSync";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface NotificationItem {
  id: number;
  title?: string;
  message?: string;
  description?: string;
  body?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
}

const DROPDOWN_LIMIT = 10;
const PLAN_LIMIT_KEYWORD = "exceeds the plan limit";
const PROCESSING_FAILED_TITLE = "video processing failed";

function normalizeNotifications(response: any): NotificationItem[] {
  if (Array.isArray(response?.notifications)) return response.notifications;
  if (Array.isArray(response?.data?.notifications)) return response.data.notifications;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function parseUnreadCount(response: any): number {
  const raw =
    response?.notifs ??
    response?.data?.notifs ??
    response?.unreadCount ??
    response?.data?.unreadCount ??
    response?.count ??
    response?.data?.count ??
    0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getProcessingFailurePayload(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  const payload = rawPayload as Record<string, unknown>;
  const nested =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : null;
  const title = (
    extractText(payload.title) ||
    extractText(payload.notificationTitle) ||
    extractText(nested?.title) ||
    extractText(nested?.notificationTitle)
  ).toLowerCase();
  const message = (
    extractText(payload.message) ||
    extractText(payload.description) ||
    extractText(payload.body) ||
    extractText(nested?.message) ||
    extractText(nested?.description) ||
    extractText(nested?.body)
  ).toLowerCase();
  const recordingIdRaw =
    payload.recordingId ??
    payload.recording_id ??
    nested?.recordingId ??
    nested?.recording_id;
  const recordingId = Number(recordingIdRaw);
  if (!Number.isFinite(recordingId)) return null;
  if (title !== PROCESSING_FAILED_TITLE) return null;
  if (!message.includes(PLAN_LIMIT_KEYWORD)) return null;
  return { recordingId };
}

const NOTIFICATION_REFRESH_EVENTS = new Set([
  "notification",
  "new_notification",
  "notification_created",
  "video_ready",
  "processing_initiated",
  "processing_failed",
  "video_deleted",
  "limit_warning",
  "new_member",
  "member_removed",
  "member_role_updated",
  "invitation_accepted",
  "invitation_expired",
  "storage_limit",
  "subscription_downgraded",
  "subscription_upgraded",
]);

export default function NotificationsBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const planLimitDeleteInFlight = useRef<Set<number>>(new Set());
  const isLoggedIn = Boolean(user);

  const loadUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(parseUnreadCount(res));
    } catch {
      // Keep previous count if request fails.
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await notificationsApi.getAll({ page: 1, limit: DROPDOWN_LIMIT });
      const next = normalizeNotifications(res);
      setNotifications(next);
    } catch (err: any) {
      if (!String(err?.message || "").toLowerCase().includes("401")) {
        toast({ title: "Failed to load notifications", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      void Promise.all([loadNotifications(), loadUnreadCount()]);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, loadNotifications, loadUnreadCount]);

  useEffect(() => {
    const unsubscribe = subscribeNotificationsUpdated((detail) => {
      if (detail?.notifications) {
        setNotifications(detail.notifications);
        setLoading(false);
      }
      if (typeof detail?.unreadCount === "number") {
        setUnreadCount(detail.unreadCount);
      } else if (user) {
        void loadUnreadCount();
      }
      if (!detail?.notifications && user) {
        void loadNotifications();
      }
    });
    return unsubscribe;
  }, [user, loadNotifications, loadUnreadCount]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      // Debounce bursty events into a single fetch.
      refreshTimer = setTimeout(() => {
        void Promise.all([loadNotifications(), loadUnreadCount()]);
      }, 250);
    };

    const onAnyEvent = (eventName: string, ...args: unknown[]) => {
      if (NOTIFICATION_REFRESH_EVENTS.has(eventName)) {
        scheduleRefresh();
      }
      if (
        eventName !== "processing_failed" &&
        eventName !== "notification" &&
        eventName !== "new_notification" &&
        eventName !== "notification_created"
      ) {
        return;
      }
      const matched = getProcessingFailurePayload(args[0]);
      if (!matched) return;
      const { recordingId } = matched;
      if (planLimitDeleteInFlight.current.has(recordingId)) return;
      planLimitDeleteInFlight.current.add(recordingId);
      void recordingsApi
        .delete(recordingId, undefined, { permanent: true })
        .catch(() => {
          // Ignore cleanup failures to avoid noisy UI errors from background socket handling.
        })
        .finally(() => {
          planLimitDeleteInFlight.current.delete(recordingId);
        });
    };

    socket.onAny(onAnyEvent);
    return () => {
      socket.offAny(onAnyEvent);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [user, loadNotifications, loadUnreadCount]);

  const handleReadOne = async (id: number, isUnread: boolean) => {
    if (!isLoggedIn || !isUnread) return;
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n));
        return next;
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      emitNotificationsUpdated();
    } catch (err: any) {
      toast({ title: "Failed to mark as read", description: err.message, variant: "destructive" });
    }
  };

  const handleReadAll = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await notificationsApi.markAllAsRead();
      setNotifications((prev) => {
        return prev.map((n) => ({ ...n, read: true, isRead: true }));
      });
      setUnreadCount(0);
      emitNotificationsUpdated();
      toastApiSuccess(res, {
        title: "Notifications updated",
        fallbackDescription: "All notifications marked as read.",
      });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="fixed top-4 right-16 z-[60] rounded-full shadow-sm"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center p-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="p-3">
          <DropdownMenuLabel className="px-0">Notifications</DropdownMenuLabel>
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-80 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : !isLoggedIn ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sign in to view notifications</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No notifications</p>
          ) : (
            notifications.map((n) => {
              const isUnread = (n.read ?? n.isRead) === false;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleReadOne(n.id, isUnread)}
                  className={`w-full text-left rounded-md border p-3 transition-colors ${
                    isUnread ? "bg-primary/5 border-primary/30" : "bg-background border-border"
                  }`}
                >
                  <p className={`text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>{n.title || "Notification"}</p>
                  {(n.message || n.description || n.body) && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {n.message || n.description || n.body}
                    </p>
                  )}
                  {n.createdAt && (
                    <p className="text-[11px] text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  )}
                </button>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="p-2 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleReadAll} className="gap-1" disabled={!isLoggedIn}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
          <Link to="/notifications">
            <Button variant="outline" size="sm" className="w-full" disabled={!isLoggedIn}>View all</Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
