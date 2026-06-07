import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { plansApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isFreePlan } from "@/lib/plans";
import {
  getCurrentWorkspaceSubscription,
  workspaceSubscriptionPlanId,
} from "@/lib/workspaceSubscription";
import { usePaidToFreeSubscribe } from "@/hooks/usePaidToFreeSubscribe";
import { PaidToFreeDialogs } from "@/components/PaidToFreeDialogs";
import PublicPageLayout from "@/components/PublicPageLayout";

export default function PlansPage() {
  const { t } = useTranslation(["billing", "common"]);
  const { toast } = useToast();
  const { user, selectedWorkspaceId } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedWorkspace = useMemo(() => {
    if (!user || !selectedWorkspaceId) return null;
    return (user.workspaces || []).find((ws: any) => String(ws.id) === selectedWorkspaceId) || null;
  }, [user, selectedWorkspaceId]);

  const currentWorkspaceSubscription = useMemo(
    () => getCurrentWorkspaceSubscription(selectedWorkspace),
    [selectedWorkspace]
  );

  const currentWorkspacePlanId = useMemo(
    () => workspaceSubscriptionPlanId(currentWorkspaceSubscription),
    [currentWorkspaceSubscription]
  );

  const {
    busyPlanId,
    confirmOpen,
    setConfirmOpen,
    periodDialogOpen,
    handlePeriodDialogOpenChange,
    paidPlanLabel,
    periodEndLabel,
    cancelSuccessMessage,
    confirmLoading,
    requestFreeSubscribe,
    handleConfirmDowngrade,
    handlePeriodDialogContinue,
    cancelDowngradeConfirm,
  } = usePaidToFreeSubscribe();

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await plansApi.getAll();
        setPlans(res?.plans || res?.data || res || []);
      } catch (err: any) {
        toast({ title: t("errorLoadingPlans"), description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, [toast]);

  const featureList = (plan: any) => {
    const features = [];
    if (plan.maxVideosPerMonth) features.push(t("common:plans.videosPerMonth", { count: plan.maxVideosPerMonth }));
    if (plan.maxVideoDuration) features.push(t("common:plans.minMaxDuration", { min: plan.maxVideoDuration, max: plan.maxVideoDuration }));
    if (plan.maxStorageGB) features.push(t("common:plans.storageGb", { gb: plan.maxStorageGB }));
    if (plan.maxTeamMembers) features.push(t("common:plans.teamMembers", { count: plan.maxTeamMembers }));
    if (plan.canDownloadVideos) features.push(t("common:plans.videoDownloads"));
    if (plan.canRemoveWaterMark) features.push(t("common:plans.noWatermark"));
    if (plan.canSharePublicLink) features.push(t("common:plans.publicSharing"));
    if (plan.teamAccess) features.push(t("common:plans.teamCollaboration"));
    return features;
  };

  const currentSubscriptionType = String(currentWorkspaceSubscription?.type || "").toLowerCase();
  const getCyclePriceUsd = (plan: any, cycle: "monthly" | "yearly") =>
    Number(
      cycle === "yearly"
        ? plan?.yearlyPriceUSD ?? plan?.yearlyPrice ?? 0
        : plan?.monthlyPriceUSD ?? plan?.monthlyPrice ?? 0,
    );
  const currentCyclePrice =
    currentWorkspaceSubscription && (currentSubscriptionType === "monthly" || currentSubscriptionType === "yearly")
      ? getCyclePriceUsd(currentWorkspaceSubscription?.plan, currentSubscriptionType as "monthly" | "yearly")
      : 0;

  const cycleLabel = (cycle: "monthly" | "yearly") => t(`cycle.${cycle}`);

  const getActionLabel = (plan: any, targetType: "monthly" | "yearly") => {
    const cycle = cycleLabel(targetType);
    if (!currentWorkspaceSubscription) return t("chooseCycle", { cycle });
    const currentPlanId = Number(currentWorkspacePlanId);
    const targetPlanId = Number(plan?.id);
    if (!Number.isNaN(currentPlanId) && currentPlanId === targetPlanId) {
      if (currentSubscriptionType === targetType) return t("common:actions.current");
      return targetType === "yearly" ? t("upgradeYearly") : t("downgradeMonthly");
    }
    const targetPrice = getCyclePriceUsd(plan, targetType);
    if (targetPrice > currentCyclePrice) return t("upgradeToCycle", { cycle });
    if (targetPrice < currentCyclePrice) return t("downgradeToCycle", { cycle });
    return t("switchToCycle", { cycle });
  };

  const formatCycleButtonLabel = (
    plan: any,
    cycle: "monthly" | "yearly",
    actionLabel: string,
    isCurrentForCycle: boolean,
  ) => {
    if (isCurrentForCycle) {
      return t("currentCycle", { cycle: cycleLabel(cycle) });
    }
    return t("planActionWithPrice", {
      action: actionLabel,
      usd: getCyclePriceUsd(plan, cycle).toLocaleString(),
      period: cycle === "yearly" ? t("yearShort") : t("monthShort"),
    });
  };

  const handleFreePlanSelect = async (plan: any) => {
    if (!user) {
      toast({
        title: t("common:plans.signInRequired"),
        description: t("common:plans.signInToSubscribe"),
      });
      return;
    }
    requestFreeSubscribe(plan);
  };

  return (
    <PublicPageLayout title={t("choosePlan")} subtitle={t("compareFeatures")}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">{t("choosePlan")}</h1>
          <p className="text-muted-foreground mt-2">{t("compareFeatures")}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan: any, i: number) => {
              const isPopular = i === 1;
              const free = isFreePlan(plan);
              const isCurrentForWorkspace =
                Boolean(user && selectedWorkspaceId && currentWorkspacePlanId != null && Number(plan.id) === currentWorkspacePlanId);

              return (
                <Card key={plan.id} className={`glass relative ${isPopular ? "border-primary ring-1 ring-primary/20" : ""}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-primary border-0 gap-1">
                        <Zap className="h-3 w-3" /> {t("common:actions.popular")}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg capitalize">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        {t("priceUsd", { amount: getCyclePriceUsd(plan, "monthly").toLocaleString() })}
                      </span>
                      <span className="text-muted-foreground">{t("perMonth")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("membersUpTo", { count: Number(plan.maxTeamMembers || 0) })}
                    </p>
                    {plan.yearlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t("yearlyPriceLine", {
                          perYear: t("perYear"),
                          usd: getCyclePriceUsd(plan, "yearly").toLocaleString(),
                        })}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-3 mb-6">
                      {featureList(plan).map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {free ? (
                      isCurrentForWorkspace ? (
                        <Button type="button" className="w-full" variant="outline" disabled>
                          {t("common:actions.currentPlan")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className={`w-full ${isPopular ? "gradient-primary" : ""}`}
                          variant={isPopular ? "default" : "outline"}
                          disabled={busyPlanId === plan.id}
                          onClick={() => handleFreePlanSelect(plan)}
                        >
                          {busyPlanId === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common:actions.subscribe")}
                        </Button>
                      )
                    ) : (
                      <div className="space-y-2">
                        {(["monthly", "yearly"] as const).map((cycle) => {
                          const isCurrentForCycle =
                            isCurrentForWorkspace && currentSubscriptionType === cycle;
                          const disabled = isCurrentForCycle;
                          const actionLabel = getActionLabel(plan, cycle);
                          const button = (
                            <Button
                              className={`w-full ${isPopular && cycle === "yearly" ? "gradient-primary" : ""}`}
                              variant={isPopular && cycle === "yearly" ? "default" : "outline"}
                              disabled={disabled}
                            >
                              {formatCycleButtonLabel(plan, cycle, actionLabel, isCurrentForCycle)}
                            </Button>
                          );
                          return (
                            disabled ? (
                              <div key={`${plan.id}-${cycle}`}>{button}</div>
                            ) : (
                              <Link
                                key={`${plan.id}-${cycle}`}
                                to={user ? `/subscription?planId=${plan.id}&type=${cycle}` : "/login"}
                                className="block"
                              >
                                {button}
                              </Link>
                            )
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <PaidToFreeDialogs
          confirmOpen={confirmOpen}
          onConfirmOpenChange={setConfirmOpen}
          paidPlanLabel={paidPlanLabel}
          onConfirmCancelSubscription={handleConfirmDowngrade}
          onDismissConfirm={cancelDowngradeConfirm}
          confirmLoading={confirmLoading}
          periodDialogOpen={periodDialogOpen}
          onPeriodDialogOpenChange={handlePeriodDialogOpenChange}
          periodEndLabel={periodEndLabel}
          cancelSuccessMessage={cancelSuccessMessage}
          onPeriodAcknowledge={handlePeriodDialogContinue}
        />
      </div>
    </PublicPageLayout>
  );
}
