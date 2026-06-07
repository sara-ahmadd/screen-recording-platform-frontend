import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { paymentsApi } from "@/lib/api";
import {
  clearPendingPaddleTransaction,
  readPendingPaddleTransaction,
} from "@/lib/paddle";
import { getCurrentWorkspaceSubscription } from "@/lib/workspaceSubscription";
import { Loader2 } from "lucide-react";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PaymentSuccessPage() {
  const { t } = useTranslation("billing");
  const { user, selectedWorkspaceId, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [syncing, setSyncing] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const transactionId = useMemo(() => {
    const fromQuery =
      searchParams.get("_ptxn") ||
      searchParams.get("transaction_id") ||
      searchParams.get("transactionId");
    if (fromQuery?.startsWith("txn_")) return fromQuery;
    return readPendingPaddleTransaction();
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!transactionId) {
        setSyncing(false);
        setSyncMessage(t("paymentSyncNoTransaction"));
        return;
      }

      try {
        const res = await paymentsApi.syncCheckout(transactionId);
        if (cancelled) return;
        setSyncMessage(
          res?.activated
            ? t("paymentSyncActivated")
            : t("paymentSyncPending"),
        );
        clearPendingPaddleTransaction();
        await refreshUser?.();
      } catch (err: any) {
        if (!cancelled) {
          setSyncMessage(String(err?.message ?? t("paymentSyncFailed")));
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [transactionId, refreshUser, t]);

  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceId) return null;
    return (
      (user?.workspaces || []).find((ws: any) => String(ws.id) === String(selectedWorkspaceId)) || null
    );
  }, [selectedWorkspaceId, user?.workspaces]);
  const currentSubscription = useMemo(
    () => getCurrentWorkspaceSubscription(selectedWorkspace),
    [selectedWorkspace],
  );

  const statusRaw = String(currentSubscription?.status || "").toLowerCase();
  const statusLabel =
    statusRaw === "active"
      ? t("statusActive")
      : statusRaw === "pending"
        ? t("statusPending")
        : statusRaw || t("statusPending");

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <Card className="glass">
          <CardHeader>
            <CardTitle>{t("paymentReceived")}</CardTitle>
            <CardDescription>{t("paymentSuccessDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("paymentSyncInProgress")}
              </div>
            ) : syncMessage ? (
              <p className="text-sm text-muted-foreground">{syncMessage}</p>
            ) : null}

            <div className="rounded-md border border-border p-4">
              <p className="text-sm text-muted-foreground">{t("colStatus")}</p>
              <p className="mt-1 text-lg font-semibold">{statusLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("nextBilling")}: {formatDate(currentSubscription?.nextBillingDate)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/billing">
                <Button className="gradient-primary">{t("goBilling")}</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline">{t("backDashboard")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
