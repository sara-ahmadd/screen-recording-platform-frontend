import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
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
  const { user, selectedWorkspaceId } = useAuth();
  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceId) return null;
    return (
      (user?.workspaces || []).find(
        (ws: any) => String(ws.id) === String(selectedWorkspaceId),
      ) || null
    );
  }, [selectedWorkspaceId, user?.workspaces]);
  const currentSubscription = useMemo(
    () => getCurrentWorkspaceSubscription(selectedWorkspace),
    [selectedWorkspace],
  );

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Payment received</CardTitle>
            <CardDescription>
              Your payment is being verified. Final subscription activation happens only after secure webhook confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border p-4">
              <p className="text-sm text-muted-foreground">Subscription status</p>
              <p className="mt-1 text-lg font-semibold">
                {String(currentSubscription?.status || "").toLowerCase() === "active"
                  ? "ACTIVE"
                  : "PENDING"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Next billing date: {formatDate(currentSubscription?.nextBillingDate)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
            <Link to="/billing">
              <Button className="gradient-primary">Go to Billing</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
