import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

type ReviewPayload = {
  checkoutSessionId?: string | number | null;
  redirectUrl?: string | null;
  plan?: {
    name?: string;
    billingCycle?: "monthly" | "yearly" | string;
    monthlyPriceUSD?: number;
    yearlyPriceUSD?: number;
    monthlyPriceEGP?: number;
    yearlyPriceEGP?: number;
  };
  amountProvider?:number,
  amountUsd?:number,
  billingData?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
};

export default function CheckoutReviewPage() {
  const location = useLocation();
  const payload = (location.state as ReviewPayload) || null;

  const cycle = String(payload?.plan?.billingCycle || "monthly").toLowerCase();
  const egp = useMemo(
    () =>
      cycle === "yearly"
        ? Number(payload?.plan?.yearlyPriceEGP || 0)
        : Number(payload?.plan?.monthlyPriceEGP || 0),
    [cycle, payload],
  );
  const usd = useMemo(
    () =>
      cycle === "yearly"
        ? Number(payload?.plan?.yearlyPriceUSD || 0)
        : Number(payload?.plan?.monthlyPriceUSD || 0),
    [cycle, payload],
  );
  const cycleLabel = cycle === "yearly" ? "year" : "month";
  const hasRedirect = Boolean(String(payload?.redirectUrl ?? "").trim());
  useEffect(() => {
    const script = document.createElement("script");
    script.src =  "https://www.merchant.geidea.net/hpp/geideaCheckout.min.js";
    script.async = true;
    document.body.appendChild(script);

       const geidea = new (window as any).GeideaCheckout({
      merchantPublicKey: import.meta.env.VITE_GEIDEA_PUBLIC_KEY,
      environment: "sandbox", // switch to production when live
    });
  }, []);

  const handlePayment = async () => {
    if (!(window as any).GeideaCheckout) {
      console.error("Geidea SDK not loaded");
      return;
    }
  
    const geidea = new (window as any).GeideaCheckout({
      merchantPublicKey: import.meta.env.VITE_GEIDEA_PUBLIC_KEY,
      environment: "sandbox", // switch to production when live
    });
    const sessionId = payload?.checkoutSessionId;
   
    console.log(sessionId)
    geidea.startPayment(
     sessionId?.toString()
    );
   
  };
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <Card className="glass border-border/70 overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Confirm your subscription
                </p>
                <CardTitle className="mt-1 text-2xl">Checkout Review</CardTitle>
              </div>
              <Badge variant="secondary" className="capitalize">
                {cycle} billing
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5 md:p-6">
            <div className="rounded-xl border border-border/70 bg-card/40 p-4">
              <p className="text-sm text-muted-foreground mb-1">
                You are about to subscribe to this plan
              </p>
              <p className="text-xl font-semibold">
                {payload?.plan?.name || "Subscription"} ({cycle})
              </p>
            </div>

            <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total due now
              </p>
              <p className="mt-2 text-3xl md:text-4xl font-bold">
                EGP {payload.amountProvider.toLocaleString()} / {cycleLabel}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                ≈ ${payload.amountUsd.toLocaleString()} USD
              </p>
            </div>

            <div className="rounded-xl border border-border/70 p-4">
              <p className="font-medium mb-3">Billing information</p>
              <div className="grid gap-2 text-sm">
                <p className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{payload?.billingData?.email || "—"}</span>
                </p>
                <p className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{payload?.billingData?.phone || "—"}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{payload?.billingData?.address || "—"}</span>
                </p>
                <p className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{payload?.billingData?.name || "—"}</span>
                </p>
              </div>
            </div>

            <Button
              type="button"
              className="w-full h-11 gradient-primary text-base font-semibold"
              disabled={!hasRedirect&&!payload?.checkoutSessionId}
              onClick={() => {
               
                handlePayment()
              }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Continue to Payment
            </Button>
            {!hasRedirect&&!payload?.checkoutSessionId ? (
              <p className="text-xs text-destructive text-center">
                Payment link is missing. Please retry checkout.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
