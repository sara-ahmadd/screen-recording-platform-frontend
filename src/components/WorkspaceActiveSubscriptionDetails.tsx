import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAvatarSrc } from "@/hooks/useAvatarSrc";
import {
  buildPlanNameByIdFromWorkspaces,
  getCurrentWorkspaceSubscription,
  isSubscriptionActiveForDisplay,
} from "@/lib/workspaceSubscription";
import { Loader2 } from "lucide-react";

function formatDate(value: string | null | undefined, emDash: string) {
  if (!value) return emDash;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return emDash;
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getPriceLabel(subscription: any, t: (key: string) => string) {
  const monthly = Number(subscription?.plan?.monthlyPrice || 0);
  const yearly = Number(subscription?.plan?.yearlyPrice || 0);
  const type = (subscription?.type || "").toLowerCase();
  if (type === "yearly") return `$${yearly}${t("perYear")}`;
  if (type === "monthly") return `$${monthly}${t("perMonth")}`;
  return monthly > 0 ? `$${monthly}${t("perMonth")}` : t("freePrice");
}

type Props = {
  workspace: any | null;
  /** When true, no workspace is selected */
  emptySelectionMessage?: string;
  allWorkspaces?: any[];
  loading?: boolean;
  title?: string;
  description?: string;
};

export function WorkspaceActiveSubscriptionDetails({
  workspace,
  emptySelectionMessage,
  allWorkspaces,
  loading = false,
  title,
  description,
}: Props) {
  const { t } = useTranslation("billing");
  const emDash = t("emDash");
  const resolvedTitle = title ?? t("activeSubscriptionTitle");
  const resolvedDescription = description ?? t("activeSubscriptionDesc");
  const resolvedEmptyMessage = emptySelectionMessage ?? t("selectWorkspaceSubscription");
  const workspaceName = String(workspace?.name || t("workspaceLabel"));

  const planNameById = useMemo(
    () => buildPlanNameByIdFromWorkspaces(allWorkspaces),
    [allWorkspaces]
  );

  const currentSubscription = useMemo(
    () => getCurrentWorkspaceSubscription(workspace),
    [workspace]
  );

  const currentPlanName = useMemo(() => {
    if (!currentSubscription) return "";
    return (
      currentSubscription?.plan?.name ||
      planNameById.get(Number(currentSubscription?.planId)) ||
      ""
    );
  }, [currentSubscription, planNameById]);

  const logoSrc = useMemo(() => {
    const raw = workspace?.logoUrl || workspace?.logo_url || workspace?.logo || "";
    return buildAvatarSrc(raw);
  }, [workspace]);

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>{resolvedTitle}</CardTitle>
        <CardDescription>{resolvedDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {!workspace ? (
          <p className="text-sm text-muted-foreground">{resolvedEmptyMessage}</p>
        ) : loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={t("workspaceLogoAlt", { name: workspaceName })}
                  className="h-12 w-12 rounded-md object-cover border border-border"
                />
              ) : (
                <div className="h-12 w-12 rounded-md bg-secondary border border-border flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {(workspaceName[0] ?? "W").toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold">{workspaceName}</p>
                <p className="text-sm text-muted-foreground">
                  {t("workspaceId")}: {workspace.id}
                </p>
              </div>
            </div>

            {!currentSubscription ? (
              <p className="text-sm text-muted-foreground">{t("noSubscriptionData")}</p>
            ) : (
              <div className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("currentPlan")}</p>
                    <p className="text-xl font-semibold capitalize">
                      {currentSubscription.plan?.name || currentPlanName || t("freePrice")}
                    </p>
                  </div>
                  <Badge
                    variant={isSubscriptionActiveForDisplay(currentSubscription) ? "default" : "secondary"}
                    className={
                      isSubscriptionActiveForDisplay(currentSubscription) ? "gradient-primary border-0" : ""
                    }
                  >
                    {(currentSubscription.status || t("notAvailable")).toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("price")}</p>
                    <p className="mt-1 text-sm font-medium">{getPriceLabel(currentSubscription, t)}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("billingCycle")}</p>
                    <p className="mt-1 text-sm font-medium capitalize">
                      {currentSubscription.type || t("notAvailable")}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("periodStart")}</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(currentSubscription.currentPeriodStart, emDash)}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("periodEnd")}</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(currentSubscription.currentPeriodEnd, emDash)}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("nextBilling")}</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(currentSubscription.nextBillingDate, emDash)}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("autoRenewal")}</p>
                    <p className="mt-1 text-sm font-medium">
                      {typeof currentSubscription.autoRenewal === "boolean"
                        ? currentSubscription.autoRenewal
                          ? t("on")
                          : t("off")
                        : t("off")}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("planLimits")}</p>
                    <p className="mt-1 text-sm font-medium">
                      {t("planLimitsSummary", {
                        videos: currentSubscription.plan?.maxVideosPerMonth ?? "-",
                        storage: currentSubscription.plan?.maxStorageGB ?? "-",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
