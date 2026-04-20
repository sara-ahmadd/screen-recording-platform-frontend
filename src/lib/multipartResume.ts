export type UploadedPartRecord = { partNumber: number; eTag: string };

/** Normalize GET …/uploads/:uploadId/parts response (S3 list parts nested shape). */
export function parseListPartsResponse(data: unknown): UploadedPartRecord[] {
  const root = data as Record<string, unknown> | null;
  const inner = root?.Parts as Record<string, unknown> | undefined;
  const list =
    (inner?.resp as { Parts?: unknown } | undefined)?.Parts ??
    inner?.Parts ??
    (Array.isArray(inner) ? inner : []);
  if (!Array.isArray(list)) return [];
  return list
    .map((p: Record<string, unknown>) => ({
      partNumber: Number(p.PartNumber ?? p.partNumber),
      eTag: String(p.ETag ?? p.eTag ?? "").replace(/"/g, ""),
    }))
    .filter((p) => Number.isFinite(p.partNumber) && p.eTag.length > 0);
}

export function sortUploadedParts(parts: UploadedPartRecord[]): UploadedPartRecord[] {
  return [...parts].sort((a, b) => a.partNumber - b.partNumber);
}

export function mergeByPartNumber(
  server: UploadedPartRecord[],
  uploaded: UploadedPartRecord[],
): UploadedPartRecord[] {
  const map = new Map<number, string>();
  for (const p of server) {
    map.set(p.partNumber, p.eTag);
  }
  for (const p of uploaded) {
    map.set(p.partNumber, p.eTag);
  }
  return sortUploadedParts(
    [...map.entries()].map(([partNumber, eTag]) => ({ partNumber, eTag })),
  );
}

/** Resolve presigned PUT URL from recordings API `getPresignedUrls` / camera variant payloads. */
export function extractPresignedUrlFromPayload(payload: unknown, partNumber: number): string {
  const directResultUrl = (payload as { result?: { url?: string }[] })?.result?.[0]?.url;
  if (typeof directResultUrl === "string" && /^https?:\/\//i.test(directResultUrl)) {
    return directResultUrl;
  }
  const isHttpUrl = (value: unknown): value is string =>
    typeof value === "string" && /^https?:\/\//i.test(value);
  const visited = new Set<unknown>();
  const extractUrl = (value: unknown): string | null => {
    if (!value || visited.has(value)) return null;
    if (isHttpUrl(value)) return value;
    if (Array.isArray(value)) {
      visited.add(value);
      for (const item of value) {
        const found = extractUrl(item);
        if (found) return found;
      }
      return null;
    }
    if (typeof value === "object") {
      visited.add(value);
      const obj = value as Record<string, unknown>;
      if (isHttpUrl(obj.url)) return obj.url;
      if (isHttpUrl(obj.signedUrl)) return obj.signedUrl;
      if (isHttpUrl(obj.presignedUrl)) return obj.presignedUrl;
      const keyedPart = obj[String(partNumber)];
      const keyedFound = extractUrl(keyedPart);
      if (keyedFound) return keyedFound;
      for (const nested of Object.values(obj)) {
        const found = extractUrl(nested);
        if (found) return found;
      }
    }
    return null;
  };
  const url = extractUrl(payload);
  if (url) return url;
  throw new Error("Could not get presigned URL for upload part.");
}
