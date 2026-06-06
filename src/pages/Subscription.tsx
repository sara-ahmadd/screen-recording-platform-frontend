import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
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
import { resolvePaddleTransactionId } from "@/lib/paddle";
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
  const { t } = useTranslation(["billing", "common"]);
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
  const [termsAndConds, setTermsAndConds] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
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
    const rawLogo = selectedWorkspace?.logoUrl || selectedWorkspace?.logo_url || selectedWorkspace?.logo || "/assets/small-logo.png";
    if(rawLogo&&(rawLogo.includes('localhost')||rawLogo.includes('placeholder')))return "/assets/small-logo.png"
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
        toast({ title: t("planLoadError"), description: err.message, variant: "destructive" });
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
    const features: string[] = [];
    if (selectedPlan.maxVideosPerMonth) {
      features.push(t("common:plans.videosPerMonth", { count: selectedPlan.maxVideosPerMonth }));
    }
    if (selectedPlan.maxVideoDuration) {
      features.push(
        t("common:plans.minMaxDuration", {
          min: selectedPlan.minVideoDuration || 0,
          max: selectedPlan.maxVideoDuration,
        }),
      );
    }
    if (selectedPlan.maxStorageGB) {
      features.push(t("common:plans.storageGb", { gb: selectedPlan.maxStorageGB }));
    }
    if (selectedPlan.maxTeamMembers) {
      features.push(t("common:plans.teamMembers", { count: selectedPlan.maxTeamMembers }));
    }
    if (selectedPlan.canDownloadVideos) features.push(t("common:plans.videoDownloads"));
    if (selectedPlan.canRemoveWaterMark) features.push(t("common:plans.noWatermark"));
    if (selectedPlan.canSharePublicLink) features.push(t("common:plans.publicSharing"));
    if (selectedPlan.teamAccess) features.push(t("common:plans.teamCollaboration"));
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
      const checkoutSessionId = subscriptionRes.checkoutSessionId;
      const checkoutUrl = String(subscriptionRes.checkoutUrl ?? "").trim();
      const redirectUrl = String(
        subscriptionRes.redirectUrl ?? subscriptionRes.checkoutUrl ?? "",
      ).trim();
      const result = subscriptionRes?.result ?? {};
      const resolvedTransactionId = resolvePaddleTransactionId(
        checkoutSessionId,
        subscriptionRes.transactionId,
        result?.sessionId,
        checkoutUrl,
        redirectUrl,
      );
      const amountProvider = Number(
        result?.checkoutAmountProvider ?? subscriptionRes?.amount_provider ?? 0,
      );
      const amountUsd = Number(
        result?.checkoutAmountUsd?? 0,
      );
      const currency = String(
        result?.checkoutCurrency ?? subscriptionRes?.provider_currency ?? "USD",
      ).toUpperCase();
    
      if (resolvedTransactionId || checkoutUrl || redirectUrl || (result?.requiresCheckout && result?.sessionId)) {
        navigate("/checkout/review", {
          state: {
            checkoutSessionId:
              resolvedTransactionId || checkoutSessionId || result?.sessionId || null,
            transactionId:
              resolvedTransactionId || checkoutSessionId || result?.sessionId || null,
            checkoutUrl: checkoutUrl || null,
            redirectUrl: redirectUrl || null,
            plan: subscriptionRes?.plan ?? {
              name: String(plan?.name || t("subscriptionPlanFallback")),
              monthlyPriceUSD: Number(plan?.monthlyPriceUSD ?? plan?.monthlyPrice ?? 0),
              yearlyPriceUSD: Number(plan?.yearlyPriceUSD ?? plan?.yearlyPrice ?? 0),
              billingCycle: type,
            },
            amountProvider,
            amountUsd,
            billingData:
              subscriptionRes?.billingData ??
              (paymentData
                ? {
                    name: `${String(paymentData.billingData.first_name || "").trim()} ${String(paymentData.billingData.last_name || "").trim()}`.trim(),
                    email: String(paymentData.billingData.email || ""),
                    phone: String(paymentData.billingData.phone_number || ""),
                    address: String(paymentData.billingData.street || ""),
                  }
                : null),
          },
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
        mainMessage: String(subscriptionRes?.message || t("updatedSuccess")),
        providerMessage: String(result?.message || t("noPaymentRequired")),
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
      const errorMessage = String(err?.message || t("subscriptionFailed"));
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
        toast({ title: t("subscriptionFailed"), description: errorMessage, variant: "destructive" });
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubscription = async () => {
    if (!selectedWorkspaceId || !plan) return;
    const isFreePlan = Number(plan?.monthlyPrice || 0) === 0 && Number(plan?.yearlyPrice || 0) === 0;
    if (!isFreePlan && !recurringConsent && !termsAndConds) {
      toast({
        title: t("consentRequired"),
        description: t("consentTerms"),
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
    if (!plan || !currentWorkspaceSubscription) return t("confirmSubscription");
    const targetPlanId = Number(plan?.id);
    const currentPlanId = Number(currentWorkspaceSubscription?.planId || currentWorkspaceSubscription?.plan?.id);
    const samePlan = !Number.isNaN(targetPlanId) && !Number.isNaN(currentPlanId) && targetPlanId === currentPlanId;
    if (samePlan) {
      if (currentSubscriptionType === type) return t("currentSubscription");
      if (currentSubscriptionType === "monthly" && type === "yearly") return t("confirmYearlyUpgrade");
      if (currentSubscriptionType === "yearly" && type === "monthly") return t("confirmMonthlyDowngrade");
      return t("confirmChange");
    }
    const currentPrice =
      currentSubscriptionType === "monthly" || currentSubscriptionType === "yearly"
        ? getCyclePrice(currentWorkspaceSubscription?.plan, currentSubscriptionType as SubscriptionType)
        : 0;
    const targetPrice = getCyclePrice(plan, type);
    if (targetPrice > currentPrice) return t("confirmUpgrade");
    if (targetPrice < currentPrice) return t("confirmDowngrade");
    return t("confirmChange");
  }, [plan, currentWorkspaceSubscription, currentSubscriptionType, type, t]);

  const isSamePlanAndCycle = useMemo(() => {
    if (!plan || !currentWorkspaceSubscription) return false;
    const targetPlanId = Number(plan?.id);
    const currentPlanId = Number(currentWorkspaceSubscription?.planId || currentWorkspaceSubscription?.plan?.id);
    if (Number.isNaN(targetPlanId) || Number.isNaN(currentPlanId)) return false;
    return targetPlanId === currentPlanId && currentSubscriptionType === type;
  }, [plan, currentWorkspaceSubscription, currentSubscriptionType, type]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("confirmSubscription")}</h1>
          <p className="text-muted-foreground mt-2">{t("reviewSubtitle")}</p>
        </div>

        {loadingPlan ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !plan ? (
          <Card className="glass">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">{t("planNotFound")}</p>
              <Link to="/" className="inline-block mt-4">
                <Button variant="outline">{t("common:actions.backToHome")}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="capitalize">{t("planLabel", { name: plan.name })}</CardTitle>
                <CardDescription>{t("planFeatures")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("maxMembers", { count: Number(plan.maxTeamMembers || 0) })}
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
                <CardTitle>{t("details")}</CardTitle>
                <CardDescription>{t("selectBillingConfirm")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("workspaceLabel")}</p>
                  {!selectedWorkspace ? (
                    <p className="text-sm text-muted-foreground">
                      {t("selectWorkspaceBeforeSubscribe")}
                    </p>
                  ) : (
                    <div className="flex items-center gap-3 rounded-md border border-border p-3">
                      {selectedWorkspaceLogo ? (
                        <img
                          src={selectedWorkspaceLogo}
                          alt={t("workspaceLogoAlt", {
                            name: selectedWorkspace.name || t("workspaceDetails.workspaceFallback"),
                          })}
                          className="h-10 w-10 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {(selectedWorkspace.name || "W")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{selectedWorkspace.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("common:workspaceIdShort", { id: selectedWorkspace.id })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {Number(plan.monthlyPrice || 0) === 0 && Number(plan.yearlyPrice || 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("freePlanNoBilling")}</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t("billingCycle")}</p>
                    <div className="flex gap-2 flex-col md:flex-row">
                      <Button
                        type="button"
                        variant={type === "monthly" ? "default" : "outline"}
                        className={type === "monthly" ? "gradient-primary" : ""}
                        onClick={() => setType("monthly")}
                      >
                        {t("monthlyCycle", {
                          usd: Number(plan.monthlyPriceUSD ?? plan.monthlyPrice ?? 0).toLocaleString(),
                        })}
                      </Button>
                      <Button
                        type="button"
                        variant={type === "yearly" ? "default" : "outline"}
                        className={type === "yearly" ? "gradient-primary" : ""}
                        onClick={() => setType("yearly")}
                      >
                        {t("yearlyCycle", {
                          usd: Number(plan.yearlyPriceUSD ?? plan.yearlyPrice ?? 0).toLocaleString(),
                        })}
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
                        {t("agreeRecurringShort")}
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms-and-conditions"
                        checked={termsAndConds}
                        onCheckedChange={(checked) =>
                          setTermsAndConds(Boolean(checked))
                        }
                      />
                      <Label
                        htmlFor="terms-and-conditions"
                        className="text-sm font-normal leading-5"
                      >
                        {t("agreeTermsPrefix")}{" "}
                        <NavLink className="text-blue-500 underline" to="/terms-and-conditions" target="_blank">
                          {t("common:nav.termsConditions")}
                        </NavLink>
                        and <NavLink className="text-blue-500 underline" to="/privacy-policy" target="_blank">
                          {t("common:nav.privacyPolicy")}
                        </NavLink>
                        .
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
                      (!recurringConsent || !termsAndConds))
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
        open={Boolean(successDetails)}
        onOpenChange={(open) => {
          if (!open) setSuccessDetails(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("updatedSuccess")}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {successDetails
                ? t("successDetail", {
                    mainMessage: successDetails.mainMessage,
                    providerMessage: successDetails.providerMessage,
                    paymentRequired: successDetails.requiresCheckout
                      ? t("paymentRequiredYes")
                      : t("paymentRequiredNo"),
                    usd: successDetails.usd.toFixed(2),
                    providerAmount: successDetails.providerAmount.toFixed(2),
                    currency: successDetails.currency,
                  })
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
              {t("goBilling")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
