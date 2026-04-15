import { isFreePlan } from "@/lib/plans";

export function buildPlanNameByIdFromWorkspaces(workspaces: any[] | undefined): Map<number, string> {
  const map = new Map<number, string>();
  for (const ws of workspaces || []) {
    const subscriptions = Array.isArray(ws?.subscriptions) ? ws.subscriptions : [];
    for (const sub of subscriptions) {
      const id = Number(sub?.planId);
      const name = sub?.plan?.name;
      if (!Number.isNaN(id) && name) {
        map.set(id, name);
      }
    }
  }
  return map;
}

/**
 * Subscription rows that should be shown as the workspace's current plan (Stripe-aligned).
 * Cancelled / ended rows are excluded so a stale workspace.subscriptionId does not win.
 */
export function isSubscriptionActiveForDisplay(sub: any | null): boolean {
  if (!sub) return false;
  const raw = sub.status;
  const s = raw == null || raw === "" ? "" : String(raw).toLowerCase();
  if (s === "active" || s === "trialing" || s === "past_due") return true;
  // Backends sometimes omit status on free-tier rows; still treat as current.
  if (!s && isFreePlan(sub.plan)) return true;
  return false;
}

function newestFirst(a: any, b: any) {
  return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
}

/** Matches Billing / workspace members resolution — only non-terminated subscriptions. */
export function getCurrentWorkspaceSubscription(workspace: any | null): any | null {
  if (!workspace) return null;
  const subscriptions: any[] = Array.isArray(workspace.subscriptions) ? workspace.subscriptions : [];

  if (subscriptions.length === 0) {
    const single = workspace.subscription || null;
    return isSubscriptionActiveForDisplay(single) ? single : null;
  }

  const activeSubscriptions = subscriptions.filter(isSubscriptionActiveForDisplay);
  if (activeSubscriptions.length === 0) return null;

  const workspaceSubscriptionId = workspace.subscriptionId;
  if (workspaceSubscriptionId) {
    const byId = activeSubscriptions.find((s) => Number(s?.id) === Number(workspaceSubscriptionId));
    if (byId) return byId;
  }

  return [...activeSubscriptions].sort(newestFirst)[0];
}

export function workspaceSubscriptionPlanId(sub: any | null): number | null {
  if (!sub) return null;
  const id = sub.planId ?? sub.plan?.id;
  if (id == null || id === "") return null;
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
}

export function isPaidSubscription(sub: any | null): boolean {
  if (!sub) return false;
  if (sub.plan && typeof sub.plan === "object") return !isFreePlan(sub.plan);
  const t = String(sub.type || "").toLowerCase();
  if (t === "monthly" || t === "yearly") return true;
  return false;
}

export function subscriptionDisplayName(sub: any): string {
  const raw = sub?.plan?.name;
  if (raw && String(raw).trim()) return String(raw);
  return "your current paid plan";
}

export { messageFromApiSuccessResponse as messageFromSubscriptionUpdateResponse } from "@/lib/apiMessage";
