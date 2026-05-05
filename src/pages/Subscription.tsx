import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { paymentsApi, plansApi, subscriptionApi } from "@/lib/api";
import { getCurrentWorkspaceSubscription } from "@/lib/workspaceSubscription";
import { buildAvatarSrc } from "@/hooks/useAvatarSrc";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { SubscriptionBillingDialog, type BillingSubmitPayload } from "@/components/billing/SubscriptionBillingDialog";
import { trackClientEvent } from "@/lib/analyticsClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type SubscriptionType = "monthly" | "yearly";

export default function SubscriptionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, selectedWorkspaceId } = useAuth();
  const planId = searchParams.get("planId");
  const requestedType = searchParams.get("type");

  const [plan, setPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<SubscriptionType>("monthly");
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [recurringConsent, setRecurringConsent] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<{
    checkoutUrl: string;
    checkoutAmountUsd:number;
    providerAmount: number;
    currency: string;
  } | null>(null);
  const [successDetails, setSuccessDetails] = useState<{
    mainMessage: string;
    providerMessage: string;
    requiresCheckout: boolean;
    usd: number;
    providerAmount: number;
    currency: string;
  } | null>(null);

  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceId) return null;
    return (user?.workspaces || []).find((ws: any) => String(ws.id) === selectedWorkspaceId) || null;
  }, [selectedWorkspaceId, user?.workspaces]);

  const selectedWorkspaceLogo = useMemo(() => {
    const rawLogo = selectedWorkspace?.logoUrl || selectedWorkspace?.logo_url || selectedWorkspace?.logo || "";
    return buildAvatarSrc(rawLogo);
  }, [selectedWorkspace]);

  const currentWorkspaceSubscription = useMemo(
    () => getCurrentWorkspaceSubscription(selectedWorkspace),
    [selectedWorkspace]
  );

  const currentSubscriptionId = currentWorkspaceSubscription?.id;
  const currentSubscriptionType = String(currentWorkspaceSubscription?.type || "").toLowerCase();
  const currentSubscriptionStatus = String(
    currentWorkspaceSubscription?.status || "",
  ).toLowerCase();
  const checkoutSubscriptionId = useMemo(() => {
    if (!currentWorkspaceSubscription) return null;
    if (currentSubscriptionStatus !== "active") return null;
    const id = currentWorkspaceSubscription?.id;
    return id != null ? String(id) : null;
  }, [currentWorkspaceSubscription, currentSubscriptionStatus]);

  const getCyclePrice = (selectedPlan: any, cycle: SubscriptionType) =>
    Number(cycle === "yearly" ? selectedPlan?.yearlyPrice || 0 : selectedPlan?.monthlyPrice || 0);

  useEffect(() => {
    async function loadPlan() {
      if (!planId) {
        setLoadingPlan(false);
        return;
      }
      try {
        const res = await plansApi.getById(Number(planId));
        setPlan(res.plan || res.data || res);
      } catch (err: any) {
        toast({ title: "Error loading plan", description: err.message, variant: "destructive" });
      } finally {
        setLoadingPlan(false);
      }
    }
    loadPlan();
  }, [planId, toast]);

  useEffect(() => {
    if (requestedType === "monthly" || requestedType === "yearly") {
      setType(requestedType);
    }
  }, [requestedType]);

  const featureList = (selectedPlan: any) => {
    const features = [];
    if (selectedPlan.maxVideosPerMonth) features.push(`${selectedPlan.maxVideosPerMonth} videos/month`);
    if (selectedPlan.maxVideoDuration) features.push(`${selectedPlan.maxVideoDuration} min max duration`);
    if (selectedPlan.maxStorageGB) features.push(`${selectedPlan.maxStorageGB} GB storage`);
    if (selectedPlan.maxTeamMembers) features.push(`${selectedPlan.maxTeamMembers} team members`);
    if (selectedPlan.canDownloadVideos) features.push("Video downloads");
    if (selectedPlan.canRemoveWaterMark) features.push("No watermark");
    if (selectedPlan.canSharePublicLink) features.push("Public sharing");
    if (selectedPlan.teamAccess) features.push("Team collaboration");
    return features;
  };

  const submitSubscription = async (paymentData?: BillingSubmitPayload): Promise<boolean> => {
    if (!selectedWorkspaceId || !plan) return false;
    setSubmitting(true);
    setPromoError(null);
    try {
      const isFreePlan = Number(plan?.monthlyPrice || 0) === 0 && Number(plan?.yearlyPrice || 0) === 0;
      const payloadType = isFreePlan ? "null" : type;
      const promoCodeTrimmed = paymentData?.promoCode?.trim() || "";
      if (promoCodeTrimmed) {
        trackClientEvent({
          eventType: "click",
          eventName: "promo_applied_attempt",
          metadata: { code: promoCodeTrimmed, route: "/subscription" },
        });
      }
      const payloadBase = {
        type: payloadType,
        planId: String(plan.id),
        ...(checkoutSubscriptionId ? { subscriptionId: checkoutSubscriptionId } : {}),
        workspaceId: selectedWorkspaceId,
        recurringConsent: isFreePlan ? true : recurringConsent,
        ...(paymentData?.country ? { country: paymentData.country } : {}),
        ...(paymentData?.billingData ? { billingData: paymentData.billingData } : {}),
        ...(promoCodeTrimmed ? { promoCode: promoCodeTrimmed } : {}),
      };

      const subscriptionRes = isFreePlan || !currentSubscriptionId
        ? await subscriptionApi.create(payloadBase as any)
        : await paymentsApi.createCheckoutSession({
            ...payloadBase,
            type,
            ...(checkoutSubscriptionId ? { subscriptionId: checkoutSubscriptionId } : {}),
          } as any);
      const sessionUrl =
        subscriptionRes.session_url || subscriptionRes.sessionUrl || subscriptionRes.url || subscriptionRes.checkoutUrl;
      const result = subscriptionRes?.result ?? {};
      const amountProvider = Number(
        result?.checkoutAmountProvider ?? subscriptionRes?.amount_provider ?? 0,
      );
      const currency = String(
        result?.checkoutCurrency ?? subscriptionRes?.provider_currency ?? "EGP",
      ).toUpperCase();
      if (sessionUrl) {
        setPendingCheckout({
          checkoutUrl: String(sessionUrl),
          checkoutAmountUsd: Number.isFinite(
            Number(result?.checkoutAmountUsd ?? subscriptionRes?.amount_usd ?? 0),
          )
            ? Number(result?.checkoutAmountUsd ?? subscriptionRes?.amount_usd ?? 0)
            : 0,
          providerAmount: Number.isFinite(amountProvider) ? amountProvider : 0,
          currency,
        });
        if (promoCodeTrimmed) {
          trackClientEvent({
            eventType: "click",
            eventName: "promo_applied_success",
            metadata: { code: promoCodeTrimmed, route: "/subscription" },
          });
        }
        return true;
      }

      setSuccessDetails({
        mainMessage: String(
          subscriptionRes?.message || "Subscription updated successfully",
        ),
        providerMessage: String(result?.message || "No payment required."),
        requiresCheckout: Boolean(result?.requiresCheckout),
        usd: Number.isFinite(
          Number(result?.checkoutAmountUsd ?? subscriptionRes?.amount_usd ?? 0),
        )
          ? Number(result?.checkoutAmountUsd ?? subscriptionRes?.amount_usd ?? 0)
          : 0,
        providerAmount: Number.isFinite(amountProvider) ? amountProvider : 0,
        currency,
      });
      if (promoCodeTrimmed) {
        trackClientEvent({
          eventType: "click",
          eventName: "promo_applied_success",
          metadata: { code: promoCodeTrimmed, route: "/subscription" },
        });
      }
      return true;
    } catch (err: any) {
      const errorMessage = String(err?.message || "Subscription failed");
      const attemptedPromoCode = paymentData?.promoCode?.trim() || "";
      if (attemptedPromoCode) {
        setPromoError(errorMessage);
        trackClientEvent({
          eventType: "click",
          eventName: "promo_applied_failed",
          metadata: {
            code: attemptedPromoCode,
            errorMessage,
            route: "/subscription",
          },
        });
      } else {
        toast({ title: "Subscription failed", description: errorMessage, variant: "destructive" });
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubscription = async () => {
    if (!selectedWorkspaceId || !plan) return;
    const isFreePlan = Number(plan?.monthlyPrice || 0) === 0 && Number(plan?.yearlyPrice || 0) === 0;
    if (!isFreePlan && !recurringConsent) {
      toast({
        title: "Consent required",
        description:
          "Please agree to automatic recurring payments before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (isFreePlan) {
      await submitSubscription();
      return;
    }

    setPromoError(null);
    setBillingDialogOpen(true);
  };

  const handleBillingDataConfirm = async (payload: BillingSubmitPayload) => {
    const success = await submitSubscription(payload);
    if (success) setBillingDialogOpen(false);
  };

  const actionLabel = useMemo(() => {
    if (!plan || !currentWorkspaceSubscription) return "Confirm Subscription";
    const targetPlanId = Number(plan?.id);
    const currentPlanId = Number(currentWorkspaceSubscription?.planId || currentWorkspaceSubscription?.plan?.id);
    const samePlan = !Number.isNaN(targetPlanId) && !Number.isNaN(currentPlanId) && targetPlanId === currentPlanId;
    if (samePlan) {
      if (currentSubscriptionType === type) return "Current subscription";
      if (currentSubscriptionType === "monthly" && type === "yearly") return "Confirm yearly upgrade";
      if (currentSubscriptionType === "yearly" && type === "monthly") return "Confirm monthly downgrade";
      return "Confirm plan change";
    }
    const currentPrice =
      currentSubscriptionType === "monthly" || currentSubscriptionType === "yearly"
        ? getCyclePrice(currentWorkspaceSubscription?.plan, currentSubscriptionType as SubscriptionType)
        : 0;
    const targetPrice = getCyclePrice(plan, type);
    if (targetPrice > currentPrice) return "Confirm upgrade";
    if (targetPrice < currentPrice) return "Confirm downgrade";
    return "Confirm plan change";
  }, [plan, currentWorkspaceSubscription, currentSubscriptionType, type]);

  const isSamePlanAndCycle = useMemo(() => {
    if (!plan || !currentWorkspaceSubscription) return false;
    const targetPlanId = Number(plan?.id);
    const currentPlanId = Number(currentWorkspaceSubscription?.planId || currentWorkspaceSubscription?.plan?.id);
    if (Number.isNaN(targetPlanId) || Number.isNaN(currentPlanId)) return false;
    return targetPlanId === currentPlanId && currentSubscriptionType === type;
  }, [plan, currentWorkspaceSubscription, currentSubscriptionType, type]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Confirm Subscription</h1>
          <p className="text-muted-foreground mt-2">Review your plan and confirm billing cycle.</p>
        </div>

        {loadingPlan ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !plan ? (
          <Card className="glass">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">Plan not found.</p>
              <Link to="/" className="inline-block mt-4">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="capitalize">{plan.name} Plan</CardTitle>
                <CardDescription>Plan features and limits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Maximum members: {Number(plan.maxTeamMembers || 0)}
                </p>
                <ul className="space-y-3">
                  {featureList(plan).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Select billing type and confirm.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Workspace</p>
                  {!selectedWorkspace ? (
                    <p className="text-sm text-muted-foreground">
                      Select a workspace before subscribing.
                    </p>
                  ) : (
                    <div className="flex items-center gap-3 rounded-md border border-border p-3">
                      {selectedWorkspaceLogo ? (
                        <img
                          src={selectedWorkspaceLogo}
                          alt={`${selectedWorkspace.name || "Workspace"} logo`}
                          className="h-10 w-10 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {(selectedWorkspace.name || "W")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{selectedWorkspace.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {selectedWorkspace.id}</p>
                      </div>
                    </div>
                  )}
                </div>

                {Number(plan.monthlyPrice || 0) === 0 && Number(plan.yearlyPrice || 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">Free plan — no billing cycle.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Billing cycle</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={type === "monthly" ? "default" : "outline"}
                        className={type === "monthly" ? "gradient-primary" : ""}
                        onClick={() => setType("monthly")}
                      >
                        Monthly (${plan.monthlyPrice || 0}/mo)
                      </Button>
                      <Button
                        type="button"
                        variant={type === "yearly" ? "default" : "outline"}
                        className={type === "yearly" ? "gradient-primary" : ""}
                        onClick={() => setType("yearly")}
                      >
                        Yearly (${plan.yearlyPrice || 0}/yr)
                      </Button>
                    </div>
                  </div>
                )}

                {!(Number(plan.monthlyPrice || 0) === 0 && Number(plan.yearlyPrice || 0) === 0) && (
                  <div className="rounded-md border border-border p-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="recurring-consent"
                        checked={recurringConsent}
                        onCheckedChange={(checked) =>
                          setRecurringConsent(Boolean(checked))
                        }
                      />
                      <Label
                        htmlFor="recurring-consent"
                        className="text-sm font-normal leading-5"
                      >
                        I agree to automatic recurring payments for this subscription.
                      </Label>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full gradient-primary"
                  onClick={handleConfirmSubscription}
                  disabled={
                    !selectedWorkspaceId ||
                    submitting ||
                    isSamePlanAndCycle ||
                    (!(Number(plan.monthlyPrice || 0) === 0 &&
                      Number(plan.yearlyPrice || 0) === 0) &&
                      !recurringConsent)
                  }
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : actionLabel}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <SubscriptionBillingDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
        submitting={submitting}
        defaultEmail={user?.email || ""}
        promoCode={promoCode}
        promoError={promoError}
        onPromoCodeChange={(value) => {
          setPromoCode(value);
          if (promoError) setPromoError(null);
        }}
        onSubmit={handleBillingDataConfirm}
      />

      <Dialog
        open={Boolean(pendingCheckout)}
        onOpenChange={(open) => {
          if (!open) setPendingCheckout(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm payment</DialogTitle>
            <DialogDescription>
            {pendingCheckout
              ? `Payable amount: $${pendingCheckout?.checkoutAmountUsd?.toFixed(2)} ~ ${pendingCheckout?.providerAmount?.toFixed(2)} ${pendingCheckout.currency}`
              : ""}
          </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingCheckout(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="gradient-primary"
              onClick={() => {
                if (!pendingCheckout?.checkoutUrl) return;
                window.location.href = pendingCheckout.checkoutUrl;
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(successDetails)}
        onOpenChange={(open) => {
          if (!open) setSuccessDetails(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscription updated successfully</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {successDetails
                ? `${successDetails.mainMessage}

${successDetails.providerMessage}

Payment required: ${successDetails.requiresCheckout ? "Yes" : "No"}
Amount: $${successDetails.usd.toFixed(2)} USD (${successDetails.providerAmount.toFixed(2)} ${successDetails.currency})`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              className="gradient-primary"
              onClick={() => {
                setSuccessDetails(null);
                navigate("/billing");
              }}
            >
              Go to Billing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
