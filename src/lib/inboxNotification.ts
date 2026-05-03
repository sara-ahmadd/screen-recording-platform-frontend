/**
 * Normalized inbox notification (REST + socket payloads).
 */

export const SUBSCRIPTION_RENEWAL_3DS_TYPE = "subscription_renewal_3ds_required";
export const PAYMOB_RENEWAL_3DS_KIND = "paymob_renewal_3ds";

export type InboxNotification = {
  id: number;
  title?: string;
  message?: string;
  description?: string;
  body?: string;
  type?: string;
  important?: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
};

export type ParsedSubscription3ds = {
  title: string;
  message: string;
  actionUrl: string | null;
  subscriptionId?: number;
  notificationId?: number;
};

function parseMetadataField(raw: unknown): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      if (p && typeof p === "object") return p as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return undefined;
}

export function normalizeInboxNotification(raw: Record<string, unknown>): InboxNotification {
  const id = Number(raw.id);
  const actionRaw = raw.actionUrl ?? raw.action_url;
  const actionUrl =
    typeof actionRaw === "string" && actionRaw.trim() ? actionRaw.trim() : null;

  const created =
    (typeof raw.createdAt === "string" && raw.createdAt) ||
    (typeof raw.created_at === "string" && raw.created_at) ||
    undefined;

  return {
    id: Number.isFinite(id) ? id : 0,
    title: String(raw.title ?? raw.notificationTitle ?? ""),
    message: String(raw.message ?? ""),
    description: raw.description != null ? String(raw.description) : undefined,
    body: raw.body != null ? String(raw.body) : undefined,
    type: raw.type != null ? String(raw.type) : undefined,
    important: Boolean(raw.important ?? raw.isImportant),
    actionUrl,
    metadata: parseMetadataField(raw.metadata),
    read: raw.read === true || raw.isRead === true,
    isRead: raw.isRead === true,
    createdAt: created,
  };
}

export function sortNotificationsImportantFirst<T extends { important?: boolean; createdAt?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const ia = a.important ? 1 : 0;
    const ib = b.important ? 1 : 0;
    if (ia !== ib) return ib - ia;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export function isSubscriptionRenewal3dsRequired(n: Pick<InboxNotification, "type" | "metadata">): boolean {
  const t = (n.type || "").toLowerCase();
  if (t === SUBSCRIPTION_RENEWAL_3DS_TYPE) return true;
  const kind = String(n.metadata?.kind ?? "").toLowerCase();
  return kind === PAYMOB_RENEWAL_3DS_KIND;
}

/** Billing / Paymob action vs generic notices — use for labels and filters. */
export function isBillingActionNotification(n: InboxNotification): boolean {
  if (isSubscriptionRenewal3dsRequired(n)) return true;
  return Boolean(n.actionUrl && /^https?:\/\//i.test(n.actionUrl));
}

export function getNotificationActionUrl(n: InboxNotification): string | null {
  const direct = n.actionUrl?.trim();
  if (direct && /^https?:\/\//i.test(direct)) return direct;
  const fromMeta = n.metadata?.actionUrl ?? n.metadata?.action_url;
  if (typeof fromMeta === "string" && /^https?:\/\//i.test(fromMeta.trim())) return fromMeta.trim();
  return null;
}

export function inboxItemToSubscription3dsGate(n: InboxNotification): ParsedSubscription3ds | null {
  if (!isSubscriptionRenewal3dsRequired(n)) return null;
  const actionUrl = getNotificationActionUrl(n);
  if (!actionUrl) return null;
  const subRaw = n.metadata?.subscriptionId ?? n.metadata?.subscription_id;
  const sid = Number(subRaw);
  return {
    title: n.title?.trim() || "Payment required",
    message:
      n.message?.trim() ||
      n.description?.trim() ||
      n.body?.trim() ||
      "Complete payment to keep your subscription.",
    actionUrl,
    subscriptionId: Number.isFinite(sid) ? sid : undefined,
    notificationId: n.id > 0 ? n.id : undefined,
  };
}

/** Socket `subscription_renewal_3ds_required` body — supports nested `notification` + `metadata`. */
export function parseSubscriptionRenewal3dsSocketPayload(raw: unknown): ParsedSubscription3ds | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const notif =
    o.notification && typeof o.notification === "object"
      ? (o.notification as Record<string, unknown>)
      : null;
  const meta =
    o.metadata && typeof o.metadata === "object"
      ? (o.metadata as Record<string, unknown>)
      : notif && typeof notif.metadata === "object"
        ? (notif.metadata as Record<string, unknown>)
        : null;

  const title = String(notif?.title ?? o.title ?? "").trim();
  const message = String(notif?.message ?? notif?.description ?? o.message ?? o.description ?? "").trim();

  const actionUrlRaw =
    meta?.actionUrl ??
    meta?.action_url ??
    o.actionUrl ??
    o.action_url ??
    notif?.actionUrl ??
    (typeof notif?.action_url === "string" ? notif.action_url : undefined);

  let actionUrl: string | null = null;
  if (typeof actionUrlRaw === "string" && /^https?:\/\//i.test(actionUrlRaw.trim())) {
    actionUrl = actionUrlRaw.trim();
  }

  const subscriptionId = Number(meta?.subscriptionId ?? meta?.subscription_id ?? o.subscriptionId);
  const notificationId = Number(
    o.notificationId ?? notif?.id ?? o.id,
  );

  return {
    title: title || "Payment required",
    message: message || "Complete payment to keep your subscription.",
    actionUrl,
    subscriptionId: Number.isFinite(subscriptionId) ? subscriptionId : undefined,
    notificationId: Number.isFinite(notificationId) ? notificationId : undefined,
  };
}

export function sessionDismissKeyFor3ds(p: Pick<ParsedSubscription3ds, "subscriptionId" | "notificationId">): string {
  if (p.subscriptionId != null && Number.isFinite(p.subscriptionId)) return `sub:${p.subscriptionId}`;
  if (p.notificationId != null && Number.isFinite(p.notificationId)) return `nid:${p.notificationId}`;
  return "unknown";
}

const SESSION_PREFIX = "therec:sub3ds:dismissed:";

export function isSubscription3dsSessionDismissed(key: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(`${SESSION_PREFIX}${key}`) === "1";
}

export function dismissSubscription3dsForSession(key: string): void {
  sessionStorage.setItem(`${SESSION_PREFIX}${key}`, "1");
}

/** Shared list extraction for `/notifications/all` (and similar) responses. */
export function normalizeNotificationsApiList(response: unknown): Record<string, unknown>[] {
  const r = response as {
    notifications?: unknown;
    data?: { notifications?: unknown } | unknown[];
  } | null;
  if (!r) return [];
  if (Array.isArray(r.notifications)) return r.notifications as Record<string, unknown>[];
  if (
    r.data &&
    typeof r.data === "object" &&
    "notifications" in r.data &&
    Array.isArray((r.data as { notifications: unknown }).notifications)
  ) {
    return (r.data as { notifications: Record<string, unknown>[] }).notifications;
  }
  if (Array.isArray(r.data)) return r.data as Record<string, unknown>[];
  if (Array.isArray(response)) return response as Record<string, unknown>[];
  return [];
}
