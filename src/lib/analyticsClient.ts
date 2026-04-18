import { analyticsApi } from "@/lib/api";

export type ClientAnalyticsPayload = Parameters<typeof analyticsApi.trackEvent>[0];

/** Fire-and-forget; failures are ignored so UX is never blocked. */
export function trackClientEvent(payload: ClientAnalyticsPayload): void {
  void analyticsApi.trackEvent(payload).catch(() => {});
}
