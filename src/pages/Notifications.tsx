import { useCallback, useEffect, useState } from "react";
import { notificationsApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { emitNotificationsUpdated, subscribeNotificationsUpdated } from "@/lib/notificationsSync";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { ArrowUpDown, Bell, Check, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

const PAGE_SIZE = 10;

function normalizeNotifications(response: any): any[] {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.notifications)) return response.notifications;
  if (Array.isArray(response?.data?.notifications)) return response.data.notifications;
  if (Array.isArray(response)) return response;
  return [];
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const confirm = useConfirmDialog();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [order, setOrder] = useState<"DESC" | "ASC">("DESC");
  const displayedTotalPages = Math.max(currentPage, totalPages);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll({ page: currentPage, limit: PAGE_SIZE, order });
      const next = normalizeNotifications(res);
      const total =
        Number(
          res?.totalPages ??
            res?.data?.totalPages ??
            res?.meta?.totalPages ??
            res?.pagination?.totalPages ??
            res?.data?.meta?.totalPages,
        ) || 0;
      const hasNext =
        typeof res?.next === "boolean"
          ? res.next
          : typeof res?.data?.next === "boolean"
            ? res.data.next
            : total > 0
              ? currentPage < total
              : next.length === PAGE_SIZE;
      setNotifications(next);
      setTotalPages(total > 0 ? total : Math.max(1, currentPage + (next.length === PAGE_SIZE ? 1 : 0)));
      setHasNextPage(hasNext);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, currentPage, order]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const unsubscribe = subscribeNotificationsUpdated(() => {
      void loadNotifications();
    });
    return unsubscribe;
  }, [loadNotifications]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void loadNotifications();
      }, 250);
    };

    const onAnyEvent = (eventName: string) => {
      if (NOTIFICATION_REFRESH_EVENTS.has(eventName)) {
        scheduleRefresh();
      }
    };

    socket.onAny(onAnyEvent);
    return () => {
      socket.offAny(onAnyEvent);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [user, loadNotifications]);

  const handleReadOne = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => {
        return prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n));
      });
      emitNotificationsUpdated();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteOne = async (id: number) => {
    const confirmed = await confirm({
      title: "Delete notification?",
      description: "This notification will be removed permanently.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      const delRes = await notificationsApi.delete(id);
      setNotifications((prev) => {
        return prev.filter((n) => n.id !== id);
      });
      emitNotificationsUpdated();
      toastApiSuccess(delRes, {
        title: "Notification deleted",
        fallbackDescription: "Notification deleted.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationsApi.markAllAsRead();
      setNotifications((prev) => {
        return prev.map((n) => ({ ...n, read: true, isRead: true }));
      });
      emitNotificationsUpdated();
      toastApiSuccess(res, {
        title: "Notifications updated",
        fallbackDescription: "All notifications marked as read.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOrder((prev) => (prev === "DESC" ? "ASC" : "DESC"));
                setCurrentPage(1);
              }}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Order: {order === "DESC" ? "Newest" : "Oldest"}
            </Button>
            <Button variant="outline" onClick={handleMarkAllRead}>Mark all as read</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : notifications.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="glass">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Notification</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((n: any) => {
                      const isUnread = (n.read ?? n.isRead) === false;
                      return (
                        <TableRow key={n.id} className={isUnread ? "bg-primary/5" : ""}>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${isUnread ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {isUnread ? "Unread" : "Read"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p className={isUnread ? "font-semibold text-sm" : "font-medium text-sm"}>{n.title || "Notification"}</p>
                            {(n.message || n.description || n.body) && (
                              <p className="text-sm text-muted-foreground mt-1 leading-relaxed break-words">
                                {n.message || n.description || n.body}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleReadOne(n.id)}
                                disabled={!isUnread}
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteOne(n.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {displayedTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {displayedTotalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={loading || !hasNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
