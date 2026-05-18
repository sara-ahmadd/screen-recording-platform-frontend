import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentWorkspaceSubscription } from "@/lib/workspaceSubscription";

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
  const { user, selectedWorkspaceId } = useAuth();
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

  const statusLabel =
    String(currentSubscription?.status || "").toLowerCase() === "active"
      ? t("statusActive")
      : t("statusPending");

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <Card className="glass">
          <CardHeader>
            <CardTitle>{t("paymentReceived")}</CardTitle>
            <CardDescription>
              Your payment is being verified. Final subscription activation happens only after secure webhook confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
