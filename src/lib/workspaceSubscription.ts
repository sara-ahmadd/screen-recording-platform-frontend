import { isFreePlan } from "@/lib/plans";

function normalizeSubscriptions(raw: unknown): any[] {
  if (!Array.isArray(raw)) return [];
  const out: any[] = [];
  const stack = [...raw];
  while (stack.length > 0) {
    const item = stack.shift();
    if (Array.isArray(item)) {
      stack.unshift(...item);
      continue;
    }
    if (item && typeof item === "object") out.push(item);
  }
  return out;
}

export function buildPlanNameByIdFromWorkspaces(workspaces: any[] | undefined): Map<number, string> {
  const map = new Map<number, string>();
  for (const ws of workspaces || []) {
    const subscriptions = normalizeSubscriptions(ws?.subscriptions);
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
  // Payment/checkout in progress — still the workspace's current subscription row.
  if (s === "pending" || s === "incomplete" || s === "incomplete_expired") return true;
  // Backends sometimes omit status on free-tier rows; still treat as current.
  if (!s && isFreePlan(sub.plan)) return true;
  return false;
}

function newestFirst(a: any, b: any) {
  return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
}

/**
 * Members/detail API responses sometimes omit nested `plan` on subscriptions; `/auth/me` usually has it.
 * Merge so Billing and other UIs keep full plan fields when ids match.
 */
export function mergeWorkspaceSubscriptionPayload(fromApi: any | null, fromProfile: any | null): any | null {
  if (!fromProfile && !fromApi) return null;
  if (!fromApi) return fromProfile;
  if (!fromProfile) return fromApi;

  const profileSubs: any[] = normalizeSubscriptions(fromProfile.subscriptions);
  const apiSubs: any[] = normalizeSubscriptions(fromApi.subscriptions);
  const profileById = new Map(profileSubs.map((s) => [Number(s?.id), s]));

  const hasUsefulPlan = (p: any) =>
    p &&
    typeof p === "object" &&
    (p.name != null ||
      p.id != null ||
      Number(p.monthlyPrice ?? 0) > 0 ||
      Number(p.yearlyPrice ?? 0) > 0);

  const mergedSubs =
    apiSubs.length > 0
      ? apiSubs.map((s) => {
          const rich = profileById.get(Number(s?.id));
          return {
            ...(rich || {}),
            ...s,
            plan: hasUsefulPlan(s?.plan) ? s.plan : rich?.plan ?? s?.plan,
          };
        })
      : profileSubs;

  return {
    ...fromProfile,
    ...fromApi,
    subscriptions: mergedSubs,
    subscriptionId: fromApi.subscriptionId ?? fromProfile.subscriptionId,
  };
}

/** Matches Billing / workspace members resolution — only non-terminated subscriptions. */
export function getCurrentWorkspaceSubscription(workspace: any | null): any | null {
  if (!workspace) return null;
  const subscriptions: any[] = normalizeSubscriptions(workspace.subscriptions);

  if (subscriptions.length === 0) {
    const single = workspace.subscription || null;
    return isSubscriptionActiveForDisplay(single) ? single : null;
  }

  let activeSubscriptions = subscriptions.filter(isSubscriptionActiveForDisplay);
  // If nothing "billable-active" yet, still show the row pointed to by workspace.subscriptionId (e.g. pending).
  if (activeSubscriptions.length === 0 && workspace.subscriptionId && subscriptions.length > 0) {
    const pinned = subscriptions.find((s) => Number(s?.id) === Number(workspace.subscriptionId));
    if (pinned) activeSubscriptions = [pinned];
  }
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
