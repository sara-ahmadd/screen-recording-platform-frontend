import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/lib/socket";
import { notificationsApi } from "@/lib/api";
import {
  dismissSubscription3dsForSession,
  inboxItemToSubscription3dsGate,
  isSubscription3dsSessionDismissed,
  normalizeInboxNotification,
  normalizeNotificationsApiList,
  parseSubscriptionRenewal3dsSocketPayload,
  sessionDismissKeyFor3ds,
  sortNotificationsImportantFirst,
  type ParsedSubscription3ds,
} from "@/lib/inboxNotification";
import { emitNotificationsUpdated } from "@/lib/notificationsSync";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function SubscriptionRenewal3dsProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [gate, setGate] = useState<ParsedSubscription3ds | null>(null);

  const tryShowGate = useCallback((parsed: ParsedSubscription3ds | null) => {
    if (!parsed?.actionUrl) return;
    const key = sessionDismissKeyFor3ds(parsed);
    if (isSubscription3dsSessionDismissed(key)) return;
    setGate(parsed);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!user || loading) {
      setOpen(false);
      setGate(null);
      return;
    }

    const socket = getSocket();
    const handler = (data: unknown) => {
      const parsed = parseSubscriptionRenewal3dsSocketPayload(data);
      tryShowGate(parsed);
      emitNotificationsUpdated();
    };

    socket.on("subscription_renewal_3ds_required", handler);
    return () => {
      socket.off("subscription_renewal_3ds_required", handler);
    };
  }, [user, loading, tryShowGate]);

  useEffect(() => {
    if (!user || loading) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await notificationsApi.getAll({ page: 1, limit: 40, order: "DESC" });
        if (cancelled) return;
        const raw = normalizeNotificationsApiList(res);
        const normalized = sortNotificationsImportantFirst(
          raw.map((row) => normalizeInboxNotification(row)),
        );
        for (const n of normalized) {
          const g = inboxItemToSubscription3dsGate(n);
          if (g) {
            tryShowGate(g);
            break;
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, tryShowGate]);

  const handleRemindLater = useCallback(() => {
    if (gate) {
      dismissSubscription3dsForSession(sessionDismissKeyFor3ds(gate));
    }
    setOpen(false);
    setGate(null);
  }, [gate]);

  const headline = "Complete payment to keep your subscription.";

  return (
    <>
      {children}
      <AlertDialog open={open} onOpenChange={(next) => !next && handleRemindLater()}>
        <AlertDialogContent className="z-[100] max-w-md border-destructive/30 bg-background shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{headline}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              {gate?.title && gate.title !== "Payment required" ? (
                <span className="block font-medium text-foreground">{gate.title}</span>
              ) : null}
              {gate?.message ? <span className="block text-muted-foreground">{gate.message}</span> : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            {gate?.actionUrl ? (
              <>
                <Button className="w-full" asChild>
                  <a href={gate.actionUrl} target="_blank" rel="noopener noreferrer">
                    Complete payment (secure window)
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    if (gate.actionUrl) window.location.assign(gate.actionUrl);
                  }}
                >
                  Continue in this tab
                </Button>
              </>
            ) : null}
            <AlertDialogCancel type="button" className="w-full sm:w-full" onClick={handleRemindLater}>
              Remind me later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
