/** Persisted so OAuth round-trips can return to accept-invite after login. */
export const PENDING_INVITE_TOKEN_KEY = "pending_invite_token";

/**
 * Mirrors the pending token for the current tab/session only. Prevents a stale
 * `pending_invite_token` in localStorage (from an old invite link) from sending
 * unrelated logins (e.g. Google) back to accept-invite.
 */
export const OAUTH_INVITE_SESSION_KEY = "oauth_invite_token";

export function bindInviteTokenForSession(token: string): void {
  localStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
  sessionStorage.setItem(OAUTH_INVITE_SESSION_KEY, token);
}

export function clearInviteFlowStorage(): void {
  localStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
  sessionStorage.removeItem(OAUTH_INVITE_SESSION_KEY);
}

/** True only when the user actively opened an invite link in this session (same tab). */
export function shouldResumeWorkspaceInvite(): boolean {
  const persisted = localStorage.getItem(PENDING_INVITE_TOKEN_KEY);
  const sessionBound = sessionStorage.getItem(OAUTH_INVITE_SESSION_KEY);
  return Boolean(persisted && sessionBound && persisted === sessionBound);
}

export function getPendingInviteToken(): string | null {
  return shouldResumeWorkspaceInvite()
    ? localStorage.getItem(PENDING_INVITE_TOKEN_KEY)
    : null;
}
