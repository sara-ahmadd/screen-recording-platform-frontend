import { getSelectedWorkspaceId, recordingsApi } from "@/lib/api";
import { parseListPartsResponse, sortUploadedParts } from "@/lib/multipartResume";

/** Same chunk size as RecordScreen (main + camera queues). */
const SCREEN_CHUNK_BYTES = 5 * 1024 * 1024;

function parseUploadStatePayload(raw: unknown) {
  const r = raw as Record<string, unknown>;
  return {
    recordingId: Number(r.recordingId),
    recordingStatus: String(r.recordingStatus ?? ""),
    multipartUploadId: r.multipartUploadId
      ? String(r.multipartUploadId)
      : undefined,
    cameraMultipartUploadId: r.cameraMultipartUploadId
      ? String(r.cameraMultipartUploadId)
      : undefined,
  };
}

/**
 * Finish screen + optional camera-track multipart uploads using **only** parts already in object storage.
 */
export async function resumeScreenRecordingFromServer(
  recordingId: number,
  options?: { onProgress?: (percent: number) => void },
): Promise<void> {
  const ws = getSelectedWorkspaceId();
  if (!ws) {
    throw new Error("Select a workspace before resuming.");
  }

  const rawState = await recordingsApi.getRecordingUploadState(recordingId);
  const state = parseUploadStatePayload(rawState);

  const mainId = state.multipartUploadId;
  const camId = state.cameraMultipartUploadId;

  if (!mainId && !camId) {
    throw new Error(
      "Nothing to finalize on the server for this recording (no active multipart sessions).",
    );
  }

  let pct = 5;

  if (mainId) {
    options?.onProgress?.(pct);
    const partsRaw = await recordingsApi.getUploadedParts(recordingId, mainId, ws);
    const parts = sortUploadedParts(parseListPartsResponse(partsRaw));
    if (parts.length === 0) {
      throw new Error(
        "No main-track parts in cloud storage yet. If upload was interrupted before any chunk finished, cancel and record again.",
      );
    }
    pct = 45;
    options?.onProgress?.(pct);
    await recordingsApi.completeUpload(recordingId, mainId, {
      data: parts,
      chunkSize: SCREEN_CHUNK_BYTES,
      workspaceId: ws,
    });
    pct = camId ? 55 : 100;
    options?.onProgress?.(pct);
  }

  if (camId) {
    const camPartsRaw = await recordingsApi.getCameraTrackUploadedParts(
      recordingId,
      camId,
      ws,
    );
    const camParts = sortUploadedParts(parseListPartsResponse(camPartsRaw));
    if (camParts.length === 0) {
      throw new Error(
        "No camera-track parts in cloud storage yet for this session.",
      );
    }
    options?.onProgress?.(Math.max(pct, 70));
    await recordingsApi.completeCameraTrackUpload(recordingId, camId, {
      workspaceId: ws,
      data: camParts,
    });
    options?.onProgress?.(100);
  } else if (!mainId) {
    options?.onProgress?.(100);
  }
}
