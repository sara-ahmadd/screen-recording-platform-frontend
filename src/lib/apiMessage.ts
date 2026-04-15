function tryStr(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

/**
 * Extracts a user-facing message from a typical JSON success body (REST or websocket payload).
 */
export function messageFromApiSuccessResponse(res: unknown): string | null {
  if (res == null) return null;
  if (typeof res === "string" && res.trim()) return res.trim();
  if (typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const nested =
    r.data && typeof r.data === "object" ? (r.data as Record<string, unknown>) : null;
  return (
    tryStr(r.message) ||
    tryStr(r.description) ||
    tryStr(r.msg) ||
    (nested &&
      (tryStr(nested.message) || tryStr(nested.description) || tryStr(nested.msg as string)))
  );
}
