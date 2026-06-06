import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import { paymentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  initPaddleJs,
  openPaddleCheckout,
  resolvePaddleConfig,
} from "@/lib/paddle";

type ReviewPayload = {
  checkoutSessionId?: string | number | null;
  transactionId?: string | null;
  redirectUrl?: string | null;
  checkoutUrl?: string | null;
  plan?: {
    name?: string;
    billingCycle?: "monthly" | "yearly" | string;
    monthlyPriceUSD?: number;
    yearlyPriceUSD?: number;
  };
  amountUsd?: number;
  renewalAmountUsd?: number;
};

function resolveTransactionId(
  ...sources: Array<string | number | null | undefined>
): string {
  for (const raw of sources) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    if (value.startsWith("txn_")) return value;
    try {
      const url = new URL(value);
      const ptxn = url.searchParams.get("_ptxn");
      if (ptxn?.startsWith("txn_")) return ptxn;
    } catch {
      // not a URL
    }
  }
  return "";
}

export default function CheckoutReviewPage() {
  const { t } = useTranslation(["billing", "common"]);
  const { toast } = useToast();
  const location = useLocation();
  const navigationPayload = (location.state as ReviewPayload) || null;
  const [resolvedPayload, setResolvedPayload] = useState<ReviewPayload | null>(
    navigationPayload,
  );
  const [loadingReview, setLoadingReview] = useState(false);
  const [paddleReady, setPaddleReady] = useState(false);
  const [paddleLoading, setPaddleLoading] = useState(true);
  const [paddleError, setPaddleError] = useState<string | null>(null);

  const queryTransactionId = new URLSearchParams(location.search).get("_ptxn");
  const transactionId = resolveTransactionId(
    resolvedPayload?.transactionId,
    resolvedPayload?.checkoutSessionId,
    queryTransactionId,
  );

  useEffect(() => {
    if (navigationPayload) {
      setResolvedPayload(navigationPayload);
      return;
    }
    if (!transactionId) return;

    let cancelled = false;
    setLoadingReview(true);
    paymentsApi
      .getCheckoutReview(transactionId)
      .then((res: any) => {
        if (cancelled) return;
        setResolvedPayload({
          checkoutSessionId: res?.checkoutSessionId ?? transactionId,
          transactionId: res?.transactionId ?? transactionId,
          plan: res?.plan,
          amountUsd: res?.amountUsd,
          renewalAmountUsd: res?.renewalAmountUsd ?? res?.amountUsd,
        });
      })
      .catch(() => {
        if (!cancelled) setResolvedPayload(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingReview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigationPayload, transactionId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setPaddleLoading(true);
      setPaddleError(null);

      const config = await resolvePaddleConfig();
      if (cancelled) return;

      if (!config) {
        setPaddleError(t("paddleNotConfigured"));
        setPaddleLoading(false);
        return;
      }

      try {
        const ready = await initPaddleJs(config);
        if (cancelled) return;
        setPaddleReady(ready);
        if (!ready) setPaddleError(t("paddleInitFailed"));
      } catch (err: any) {
        if (cancelled) return;
        setPaddleError(String(err?.message ?? t("paddleInitFailed")));
      } finally {
        if (!cancelled) setPaddleLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const payload = resolvedPayload;
  const cycle = String(payload?.plan?.billingCycle || "monthly").toLowerCase();
  const amountUsd = useMemo(() => {
    if (payload?.amountUsd != null) return Number(payload.amountUsd);
    return cycle === "yearly"
      ? Number(payload?.plan?.yearlyPriceUSD || 0)
      : Number(payload?.plan?.monthlyPriceUSD || 0);
  }, [cycle, payload]);

  const renewalAmountUsd = useMemo(() => {
    if (payload?.renewalAmountUsd != null) return Number(payload.renewalAmountUsd);
    return cycle === "yearly"
      ? Number(payload?.plan?.yearlyPriceUSD || 0)
      : Number(payload?.plan?.monthlyPriceUSD || 0);
  }, [cycle, payload]);

  const cycleKey = cycle === "yearly" ? "yearly" : "monthly";
  const cycleLabel = t(`cycle.${cycleKey}`);
  const periodLabel = cycle === "yearly" ? t("yearShort") : t("monthShort");
  const canCheckout = Boolean(transactionId && paddleReady);

  const handlePayment = useCallback(() => {
    if (!transactionId) {
      toast({
        title: t("paymentLinkMissing"),
        variant: "destructive",
      });
      return;
    }

    if (!paddleReady) {
      toast({
        title: t("paddleCheckoutUnavailable"),
        description: paddleError ?? t("paddleLoading"),
        variant: "destructive",
      });
      return;
    }

    const opened = openPaddleCheckout(transactionId);
    if (!opened) {
      toast({
        title: t("paddleCheckoutUnavailable"),
        description: t("paddleInitFailed"),
        variant: "destructive",
      });
    }
  }, [transactionId, paddleReady, paddleError, toast, t]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <Card className="glass border-border/70 overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("confirmYourSubscription")}
                </p>
                <CardTitle className="mt-1 text-2xl">{t("checkoutReview")}</CardTitle>
              </div>
              <Badge variant="secondary" className="capitalize">
                {t("cycleBilling", { cycle: cycleLabel })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5 md:p-6">
            <div className="rounded-xl border border-border/70 bg-card/40 p-4">
              <p className="text-sm text-muted-foreground mb-1">{t("aboutToSubscribe")}</p>
              <p className="text-xl font-semibold">
                {t("planWithCycle", {
                  name: payload?.plan?.name || t("subscription"),
                  cycle: cycleLabel,
                })}
              </p>
            </div>

            <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-5 shadow-sm space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("totalDueNow")}
                </p>
                <p className="mt-2 text-3xl md:text-4xl font-bold">
                  {t("priceUsd", { amount: amountUsd.toLocaleString() })} / {periodLabel}
                </p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 border-t border-border/50 pt-3">
                <p>{t("renewalDisclosure", { amount: renewalAmountUsd.toLocaleString(), cycle: cycleLabel })}</p>
                <p>{t("cancelAnytimeNote")}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 p-4 text-sm space-y-2">
              <p className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>{t("paddleMorDisclosure")}</span>
              </p>
              <p className="text-muted-foreground">
                <Link to="/refund-policy" className="underline underline-offset-2 text-foreground">
                  {t("common:nav.refundPolicy")}
                </Link>
                {" · "}
                <Link to="/terms-and-conditions" className="underline underline-offset-2 text-foreground">
                  {t("common:nav.termsConditions")}
                </Link>
              </p>
            </div>

            <Button
              type="button"
              className="w-full h-11 gradient-primary text-base font-semibold"
              disabled={!transactionId || loadingReview || paddleLoading || !paddleReady}
              onClick={handlePayment}
            >
              <CreditCard className="h-4 w-4 me-2" />
              {paddleLoading ? t("paddleLoading") : t("continueToPayment")}
            </Button>

            {!transactionId ? (
              <p className="text-xs text-destructive text-center">{t("paymentLinkMissing")}</p>
            ) : null}

            {paddleError ? (
              <p className="text-xs text-destructive text-center">{paddleError}</p>
            ) : null}

            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {t("paddleSecureOverlay")}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
