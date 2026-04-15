import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { plansApi, subscriptionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isFreePlan } from "@/lib/plans";
import { toastApiSuccess } from "@/lib/appToast";
import {
  getCurrentWorkspaceSubscription,
  isPaidSubscription,
  workspaceSubscriptionPlanId,
} from "@/lib/workspaceSubscription";
import { usePaidToFreeSubscribe } from "@/hooks/usePaidToFreeSubscribe";
import { PaidToFreeDialogs } from "@/components/PaidToFreeDialogs";

export default function PlansPage() {
  const { toast } = useToast();
  const { user, selectedWorkspaceId, refreshUser } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeCancelLoading, setFreeCancelLoading] = useState(false);

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
        toast({ title: "Error loading plans", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, [toast]);

  const featureList = (plan: any) => {
    const features = [];
    if (plan.maxVideosPerMonth) features.push(`${plan.maxVideosPerMonth} videos/month`);
    if (plan.maxVideoDuration) features.push(`${plan.maxVideoDuration} min max duration`);
    if (plan.maxStorageGB) features.push(`${plan.maxStorageGB} GB storage`);
    if (plan.maxTeamMembers) features.push(`${plan.maxTeamMembers} team members`);
    if (plan.canDownloadVideos) features.push("Video downloads");
    if (plan.canRemoveWaterMark) features.push("No watermark");
    if (plan.canSharePublicLink) features.push("Public sharing");
    if (plan.teamAccess) features.push("Team collaboration");
    return features;
  };

  const currentSubscriptionType = String(currentWorkspaceSubscription?.type || "").toLowerCase();
  const getCyclePrice = (plan: any, cycle: "monthly" | "yearly") =>
    Number(cycle === "yearly" ? plan?.yearlyPrice || 0 : plan?.monthlyPrice || 0);

  const currentCyclePrice =
    currentWorkspaceSubscription && (currentSubscriptionType === "monthly" || currentSubscriptionType === "yearly")
      ? getCyclePrice(currentWorkspaceSubscription?.plan, currentSubscriptionType as "monthly" | "yearly")
      : 0;

  const getActionLabel = (plan: any, targetType: "monthly" | "yearly") => {
    if (!currentWorkspaceSubscription) return `Choose ${targetType}`;
    const currentPlanId = Number(currentWorkspacePlanId);
    const targetPlanId = Number(plan?.id);
    if (!Number.isNaN(currentPlanId) && currentPlanId === targetPlanId) {
      if (currentSubscriptionType === targetType) return "Current";
      return targetType === "yearly" ? "Upgrade to yearly" : "Downgrade to monthly";
    }
    const targetPrice = getCyclePrice(plan, targetType);
    if (targetPrice > currentCyclePrice) return `Upgrade to ${targetType}`;
    if (targetPrice < currentCyclePrice) return `Downgrade to ${targetType}`;
    return `Switch to ${targetType}`;
  };

  const handleFreePlanSelect = async (plan: any) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to the free plan.",
      });
      return;
    }

    if (currentWorkspaceSubscription?.id && isPaidSubscription(currentWorkspaceSubscription)) {
      setFreeCancelLoading(true);
      try {
        const res = await subscriptionApi.update(Number(currentWorkspaceSubscription.id));
        toastApiSuccess(res, {
          title: "Subscription updated",
          fallbackDescription: "Your paid subscription was cancelled and switched to free.",
        });
        await refreshUser();
      } catch (err: any) {
        toast({
          title: "Could not cancel subscription",
          description: err?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setFreeCancelLoading(false);
      }
      return;
    }

    requestFreeSubscribe(plan);
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-2">Compare features and continue to subscription confirmation.</p>
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
                        <Zap className="h-3 w-3" /> Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg capitalize">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${plan.monthlyPrice || 0}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Up to {Number(plan.maxTeamMembers || 0)} members
                    </p>
                    {plan.yearlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ${plan.yearlyPrice}/year (save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)
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
                          Current plan
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className={`w-full ${isPopular ? "gradient-primary" : ""}`}
                          variant={isPopular ? "default" : "outline"}
                          disabled={busyPlanId === plan.id || freeCancelLoading}
                          onClick={() => handleFreePlanSelect(plan)}
                        >
                          {busyPlanId === plan.id || freeCancelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
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
                              {isCurrentForCycle
                                ? `Current (${cycle})`
                                : `${actionLabel} ($${getCyclePrice(plan, cycle)}/${cycle === "yearly" ? "yr" : "mo"})`}
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
    </AppLayout>
  );
}
