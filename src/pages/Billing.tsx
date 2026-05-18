import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionApi, workspaceApi } from "@/lib/api";
import {
  getCurrentWorkspaceSubscription,
  isSubscriptionActiveForDisplay,
  mergeWorkspaceSubscriptionPayload,
} from "@/lib/workspaceSubscription";
import { toastApiSuccess } from "@/lib/appToast";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildAvatarSrc } from "@/hooks/useAvatarSrc";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const { t } = useTranslation(["billing", "common"]);
  const { selectedWorkspaceId, user } = useAuth();
  const { toast } = useToast();
  const [workspaceDetails, setWorkspaceDetails] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"cancel" | null>(null);

  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceId) return null;
    return (user?.workspaces || []).find((ws: any) => String(ws.id) === selectedWorkspaceId) || null;
  }, [selectedWorkspaceId, user?.workspaces]);

  const planNameById = useMemo(() => {
    const map = new Map<number, string>();
    const workspaces = user?.workspaces || [];
    for (const ws of workspaces) {
      const subscriptions = Array.isArray((ws as any)?.subscriptions) ? (ws as any).subscriptions : [];
      for (const sub of subscriptions) {
        const id = Number(sub?.planId);
        const name = sub?.plan?.name;
        if (!Number.isNaN(id) && name) {
          map.set(id, name);
        }
      }
    }
    return map;
  }, [user?.workspaces]);

  const selectedWorkspaceLogo = useMemo(() => {
    const rawLogo = selectedWorkspace?.logoUrl || selectedWorkspace?.logo_url || selectedWorkspace?.logo || "";
    return buildAvatarSrc(rawLogo);
  }, [selectedWorkspace]);

  const workspaceForSubscription = useMemo(
    () => mergeWorkspaceSubscriptionPayload(workspaceDetails, selectedWorkspace),
    [workspaceDetails, selectedWorkspace],
  );

  const currentSubscription = useMemo(() => {
    return getCurrentWorkspaceSubscription(workspaceForSubscription);
  }, [workspaceForSubscription]);

  const currentPlanName = useMemo(() => {
    if (!currentSubscription) return "";
    return (
      currentSubscription?.plan?.name ||
      planNameById.get(Number(currentSubscription?.planId)) ||
      ""
    );
  }, [currentSubscription, planNameById]);

  const isCurrentActive = isSubscriptionActiveForDisplay(currentSubscription);
  const currentSubscriptionType = String(currentSubscription?.type || "").toLowerCase();
  const getCyclePrice = (plan: any, cycle: "monthly" | "yearly") =>
    Number(cycle === "yearly" ? plan?.yearlyPrice || 0 : plan?.monthlyPrice || 0);

  const isCurrentFree = useMemo(() => {
    if (!currentSubscription) return false;
    const plan = currentSubscription.plan;
    const name = String(plan?.name || currentPlanName || "").toLowerCase();
    if (name === "free") return true;
    if (
      plan &&
      Number(plan.monthlyPrice || 0) === 0 &&
      Number(plan.yearlyPrice || 0) === 0
    ) {
      return true;
    }
    return false;
  }, [currentSubscription, currentPlanName]);

  const subscriptionHistory = useMemo(() => {
    const subscriptions = Array.isArray(workspaceForSubscription?.subscriptions)
      ? workspaceForSubscription.subscriptions
      : [];
    return [...subscriptions].sort(
      (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
    );
  }, [workspaceForSubscription]);

  const loadWorkspaceDetails = useCallback(async () => {
    if (!selectedWorkspaceId) {
      setWorkspaceDetails(null);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await workspaceApi.members(Number(selectedWorkspaceId));
      const workspace =
        res?.workspace ||
        res?.data?.workspace ||
        res?.members?.workspace ||
        null;
      setWorkspaceDetails(workspace);
    } catch (err: any) {
      setWorkspaceDetails(null);
      toast({
        title: t("historyLoadError"),
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedWorkspaceId, toast]);

  useEffect(() => {
    loadWorkspaceDetails();
  }, [loadWorkspaceDetails]);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const periodRange = (start?: string | null, end?: string | null) => {
    const a = formatDate(start);
    const b = formatDate(end);
    if (a === "—" && b === "—") return "—";
    if (a === "—") return b;
    if (b === "—") return a;
    return `${a} → ${b}`;
  };

  const getPriceLabel = (subscription: any) => {
    const monthly = Number(subscription?.plan?.monthlyPrice || 0);
    const yearly = Number(subscription?.plan?.yearlyPrice || 0);
    const type = (subscription?.type || "").toLowerCase();
    if (type === "yearly") return `$${yearly}/year`;
    if (type === "monthly") return `$${monthly}/month`;
    return monthly > 0 ? `$${monthly}/month` : t("freePrice");
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription?.id) return;
    setActionLoading("cancel");
    try {
      const res = await subscriptionApi.update(Number(currentSubscription.id));
      toastApiSuccess(res, {
        title: t("updated"),
        fallbackDescription: t("updatedDesc"),
      });
      await loadWorkspaceDetails();
    } catch (err: any) {
      toast({ title: t("cancelFailed"), description: err?.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">{t("subscription")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle>{t("currentWorkspace")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedWorkspaceId ? (
              <p className="text-sm text-muted-foreground">{t("selectWorkspace")}</p>
            ) : !selectedWorkspace ? (
              <p className="text-sm text-muted-foreground">{t("workspaceNotFound")}</p>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  {selectedWorkspaceLogo ? (
                    <img
                      src={selectedWorkspaceLogo}
                      alt={`${selectedWorkspace.name || "Workspace"} logo`}
                      className="h-12 w-12 rounded-md object-cover border border-border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-secondary border border-border flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {(selectedWorkspace.name || "W")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold">{selectedWorkspace.name || "Workspace"}</p>
                    <p className="text-sm text-muted-foreground">Workspace ID: {selectedWorkspace.id}</p>
                  </div>
                </div>

                {!currentSubscription ? (
                  <p className="text-sm text-muted-foreground">{t("noSubscriptionData")}</p>
                ) : (
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("currentPlan")}</p>
                        <p className="text-xl font-semibold capitalize">{currentSubscription.plan?.name || "Free"}</p>
                      </div>
                      <Badge
                        variant={isSubscriptionActiveForDisplay(currentSubscription) ? "default" : "secondary"}
                        className={
                          isSubscriptionActiveForDisplay(currentSubscription) ? "gradient-primary border-0" : ""
                        }
                      >
                        {(currentSubscription.status || "unknown").toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-md border border-border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("price")}</p>
                        <p className="mt-1 text-sm font-medium">{getPriceLabel(currentSubscription)}</p>
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("billingCycle")}</p>
                        <p className="mt-1 text-sm font-medium capitalize">{currentSubscription.type || "N/A"}</p>
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("periodStart")}</p>
                        <p className="mt-1 text-sm font-medium">{formatDate(currentSubscription.currentPeriodStart)}</p>
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("periodEnd")}</p>
                        <p className="mt-1 text-sm font-medium">{formatDate(currentSubscription.currentPeriodEnd)}</p>
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("nextBilling")}</p>
                        <p className="mt-1 text-sm font-medium">{formatDate(currentSubscription.nextBillingDate)}</p>
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("autoRenewal")}</p>
                        <p className="mt-1 text-sm font-medium">
                          {typeof currentSubscription.autoRenewal === "boolean"
                            ? currentSubscription.autoRenewal
                              ? t("on")
                              : t("off")
                            : currentSubscription.stripeSubscriptionId
                              ? t("on")
                              : t("off")}
                        </p>
                        {currentSubscription.cancelAtPeriodEnd ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("cancellationAccessNote")}
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("planLimits")}</p>
                        <p className="mt-1 text-sm font-medium">
                          {currentSubscription.plan?.maxVideosPerMonth ?? "-"} videos/mo, {currentSubscription.plan?.maxStorageGB ?? "-"} GB,{" "}
                          {currentSubscription.plan?.maxTeamMembers ?? "-"} members
                        </p>
                      </div>
                    </div>
                    {isCurrentActive && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        {!isCurrentFree && (
                          <Button
                            variant="destructive"
                            onClick={handleCancelSubscription}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("cancelSubscription")}
                          </Button>
                        )}
                        {!isCurrentFree && (
                          <>
                            {(["monthly", "yearly"] as const).map((cycle) => {
                              const isCurrentCycle = currentSubscriptionType === cycle;
                              const cyclePrice = getCyclePrice(currentSubscription?.plan, cycle);
                              const switchLabel =
                                currentSubscriptionType === "monthly" && cycle === "yearly"
                                  ? t("upgradeYearly")
                                  : currentSubscriptionType === "yearly" && cycle === "monthly"
                                    ? t("downgradeMonthly")
                                    : `Switch to ${cycle}`;

                              return isCurrentCycle ? (
                                <Button key={cycle} variant="outline" disabled>
                                  Current ({cycle})
                                </Button>
                              ) : (
                                <Link
                                  key={cycle}
                                  to={`/subscription?planId=${currentSubscription?.planId || currentSubscription?.plan?.id}&type=${cycle}`}
                                >
                                  <Button variant="outline" disabled={actionLoading !== null}>
                                    {switchLabel} (${cyclePrice}/{cycle === "yearly" ? "yr" : "mo"})
                                  </Button>
                                </Link>
                              );
                            })}
                          </>
                        )}
                        <Link to="/plans">
                          <Button className="gradient-primary" disabled={actionLoading !== null}>
                            {t("changePlan")}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>{t("history")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : subscriptionHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
            ) : (
              <div className="rounded-xl border border-border/80 bg-card/40 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent bg-muted/30">
                      <TableHead className="min-w-[140px] font-semibold text-foreground/90">{t("colPlan")}</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-foreground/90">{t("colStatus")}</TableHead>
                      <TableHead className="min-w-[90px] font-semibold text-foreground/90">{t("colBilling")}</TableHead>
                      <TableHead className="min-w-[100px] font-semibold text-foreground/90">{t("colPrice")}</TableHead>
                      <TableHead className="min-w-[200px] font-semibold text-foreground/90">{t("colPeriod")}</TableHead>
                      <TableHead className="min-w-[120px] font-semibold text-foreground/90">{t("colCreated")}</TableHead>
                      <TableHead className="min-w-[120px] font-semibold text-foreground/90 hidden lg:table-cell">{t("colUpdated")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptionHistory.map((sub: any) => {
                      const isCurrent =
                        currentSubscription?.id != null &&
                        Number(sub?.id) === Number(currentSubscription.id);
                      const planName =
                        sub?.plan?.name ||
                        planNameById.get(Number(sub?.planId)) ||
                        `Plan ${sub.planId ?? "—"}`;
                      const status = String(sub?.status || "pending").toLowerCase();
                      const statusVariant =
                        status === "active"
                          ? "default"
                          : status === "canceled" || status === "cancelled"
                            ? "destructive"
                            : "secondary";
                      return (
                        <TableRow
                          key={sub.id}
                          className={
                            isCurrent
                              ? "bg-primary/[0.07] hover:bg-primary/[0.09]"
                              : "border-border/60"
                          }
                        >
                          <TableCell
                            className={cn("font-medium", isCurrent && "border-l-[3px] border-l-primary pl-[13px]")}
                          >
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                              <span className="capitalize">{planName}</span>
                              {isCurrent && (
                                <Badge className="gradient-primary border-0 w-fit text-[10px] uppercase tracking-wide">
                                  {t("currentBadge")}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusVariant as "default" | "secondary" | "destructive"}
                              className={
                                status === "active"
                                  ? "gradient-primary border-0 font-normal"
                                  : "font-normal capitalize"
                              }
                            >
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize text-muted-foreground">
                            {sub.type && sub.type !== "null" ? sub.type : "—"}
                          </TableCell>
                          <TableCell className="tabular-nums">{getPriceLabel(sub)}</TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                            {periodRange(sub.currentPeriodStart, sub.currentPeriodEnd)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(sub.createdAt)}</TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">
                            {formatDate(sub.updatedAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
