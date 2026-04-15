import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAvatarSrc } from "@/hooks/useAvatarSrc";
import {
  buildPlanNameByIdFromWorkspaces,
  getCurrentWorkspaceSubscription,
  isSubscriptionActiveForDisplay,
} from "@/lib/workspaceSubscription";
import { Loader2 } from "lucide-react";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getPriceLabel(subscription: any) {
  const monthly = Number(subscription?.plan?.monthlyPrice || 0);
  const yearly = Number(subscription?.plan?.yearlyPrice || 0);
  const type = (subscription?.type || "").toLowerCase();
  if (type === "yearly") return `$${yearly}/year`;
  if (type === "monthly") return `$${monthly}/month`;
  return monthly > 0 ? `$${monthly}/month` : "Free";
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
  emptySelectionMessage = "Select a workspace to see its active subscription.",
  allWorkspaces,
  loading = false,
  title = "Active subscription",
  description = "Current plan for your selected workspace.",
}: Props) {
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
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!workspace ? (
          <p className="text-sm text-muted-foreground">{emptySelectionMessage}</p>
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
                  alt={`${workspace.name || "Workspace"} logo`}
                  className="h-12 w-12 rounded-md object-cover border border-border"
                />
              ) : (
                <div className="h-12 w-12 rounded-md bg-secondary border border-border flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {(workspace.name || "W")[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold">{workspace.name || "Workspace"}</p>
                <p className="text-sm text-muted-foreground">Workspace ID: {workspace.id}</p>
              </div>
            </div>

            {!currentSubscription ? (
              <p className="text-sm text-muted-foreground">No subscription data available for this workspace.</p>
            ) : (
              <div className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Current plan</p>
                    <p className="text-xl font-semibold capitalize">
                      {currentSubscription.plan?.name || currentPlanName || "Free"}
                    </p>
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
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Price</p>
                    <p className="mt-1 text-sm font-medium">{getPriceLabel(currentSubscription)}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Billing cycle</p>
                    <p className="mt-1 text-sm font-medium capitalize">{currentSubscription.type || "N/A"}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Current period start</p>
                    <p className="mt-1 text-sm font-medium">{formatDate(currentSubscription.currentPeriodStart)}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Current period end</p>
                    <p className="mt-1 text-sm font-medium">{formatDate(currentSubscription.currentPeriodEnd)}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Auto renewal</p>
                    <p className="mt-1 text-sm font-medium">{currentSubscription.stripeSubscriptionId ? "On" : "Off"}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan limits</p>
                    <p className="mt-1 text-sm font-medium">
                      {currentSubscription.plan?.maxVideosPerMonth ?? "-"} videos/mo,{" "}
                      {currentSubscription.plan?.maxStorageGB ?? "-"} GB
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
