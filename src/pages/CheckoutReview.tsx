import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Checkout review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                You are about to subscribe to this plan
              </p>
              <p className="text-lg font-semibold">
                {payload?.plan?.name || "Subscription"} ({cycle})
              </p>
            </div>

            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-2xl font-bold">
                EGP {egp.toLocaleString()} / {cycle === "yearly" ? "year" : "month"}
              </p>
              <p className="text-sm text-muted-foreground">≈ ${usd.toLocaleString()} USD</p>
            </div>

            <div className="rounded-lg border border-border/70 p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name: </span>{payload?.billingData?.name || "—"}</p>
              <p><span className="text-muted-foreground">Email: </span>{payload?.billingData?.email || "—"}</p>
              <p><span className="text-muted-foreground">Phone: </span>{payload?.billingData?.phone || "—"}</p>
              <p><span className="text-muted-foreground">Address: </span>{payload?.billingData?.address || "—"}</p>
            </div>

            <Button
              type="button"
              className="w-full gradient-primary"
              onClick={() => {
                const redirectUrl = String(payload?.redirectUrl || "").trim();
                if (!redirectUrl) return;
                window.location.href = redirectUrl;
              }}
            >
              Continue to Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
