import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSelectedWorkspaceId, recordingsApi } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import {
  AppWindow,
  Check,
  Clock,
  Globe,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Square,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackClientEvent } from "@/lib/analyticsClient";
import { resumeScreenRecordingFromServer } from "@/lib/resumeScreenUpload";

type RecordingState = "idle" | "recording" | "paused" | "stopping" | "processing";

type ShareTarget = "screen" | "window" | "tab";
type CameraMergePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type CameraMergeShape = "circle" | "rounded-rect";
type FloatingPreviewMode = "inline" | "detached-window" | "native-pip";
type UploadedPart = { partNumber: number; eTag: string };
type CameraPreviewPosition = { left: number; top: number };

const CHUNK_TIMESLICE_MS = 1000;
const TARGET_UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024;

export default function RecordScreenCopy() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [state, setState] = useState<RecordingState>("idle");
  const [title, setTitle] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [workspaceAlertOpen, setWorkspaceAlertOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [countdownOpen, setCountdownOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [detachedControlsActive, setDetachedControlsActive] = useState(false);
  const [shareTarget, setShareTarget] = useState<ShareTarget>("screen");
  const [shareSystemSound, setShareSystemSound] = useState(true);
  const [cameraMergePosition, setCameraMergePosition] = useState<CameraMergePosition>("bottom-right");
  const [cameraMergeShape, setCameraMergeShape] = useState<CameraMergeShape>("circle");
  const [cameraMergeScale, setCameraMergeScale] = useState(0.28);
  const [pendingDraftId, setPendingDraftId] = useState<number | null>(null);
  const [pendingDraftTitle, setPendingDraftTitle] = useState("");
  const [micPermission, setMicPermission] = useState<string>("unknown");
  const [cameraPermission, setCameraPermission] = useState<string>("unknown");
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null);
  const [systemAudioDetected, setSystemAudioDetected] = useState<boolean | null>(null);
  const [floatingPreviewMode, setFloatingPreviewMode] = useState<FloatingPreviewMode>("inline");
  const [cameraPreviewPosition, setCameraPreviewPosition] = useState<CameraPreviewPosition | null>(null);
  const [cameraPreviewDragging, setCameraPreviewDragging] = useState(false);
  const recordingStateRef = useRef<RecordingState>("idle");
  const cameraEnabledRef = useRef(false);

  const screenPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const screenSourceVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraSourceVideoRef = useRef<HTMLVideoElement | null>(null);

  const displayStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraUploadSessionRef = useRef<{
    recordingId: number;
    uploadId: string;
    workspaceId: string;
    contentType: string;
    nextPart: number;
    queue: Blob[];
    bufferedChunks: Blob[];
    bufferedBytes: number;
    uploadedParts: UploadedPart[];
    uploading: boolean;
    doneCollecting: boolean;
    resolveDrain?: () => void;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawLoopRef = useRef<number | null>(null);
  const hiddenDrawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadSessionRef = useRef<{
    recordingId: number;
    uploadId: string;
    nextPart: number;
    queue: Blob[];
    bufferedChunks: Blob[];
    bufferedBytes: number;
    uploadedParts: UploadedPart[];
    uploading: boolean;
    doneCollecting: boolean;
    resolveDrain?: () => void;
  } | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsPipWindowRef = useRef<Window | null>(null);
  const nativeCameraPipActiveRef = useRef(false);
  const cameraPreviewContainerRef = useRef<HTMLDivElement | null>(null);
  const [uploadingDrafts, setUploadingDrafts] = useState<
    { id: number; title?: string }[]
  >([]);
  const [screenResuming, setScreenResuming] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);

  const refreshUploadingDrafts = useCallback(async () => {
    try {
      const listRes = await recordingsApi.myRecordings({
        limit: 200,
        page: 1,
        filters: { unfinishedMultipart: true },
      });
      const rows =
        (listRes as { recordings?: { id?: number; title?: string }[] }).recordings ??
        (listRes as { data?: { id?: number; title?: string }[] }).data ??
        [];
      setUploadingDrafts(
        rows.map((r) => ({
          id: Number(r.id),
          title: typeof r.title === "string" ? r.title : undefined,
        })),
      );
    } catch {
      setUploadingDrafts([]);
    }
  }, []);

  const formattedTime = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [elapsed]);

  const cameraPreviewPlacementClass = useMemo(() => {
    switch (cameraMergePosition) {
      case "top-left":
        return "top-6 left-6";
      case "top-right":
        return "top-6 right-6";
      case "bottom-left":
        return "bottom-28 left-6";
      case "bottom-right":
      default:
        return "bottom-28 right-6";
    }
  }, [cameraMergePosition]);

  const cameraPreviewSize = useMemo(() => {
    const baseWidth = 260;
    const ratio = cameraMergeScale / 0.28;
    return Math.round(baseWidth * ratio);
  }, [cameraMergeScale]);
  const cameraPreviewHeight = useMemo(
    () => Math.round((cameraPreviewSize * 9) / 16),
    [cameraPreviewSize],
  );

  const syncCameraMergePositionFromViewport = useCallback((left: number, top: number) => {
    const previewWidth = cameraPreviewSize + 16;
    const previewHeight = cameraPreviewHeight + 16;
    const centerX = left + previewWidth / 2;
    const centerY = top + previewHeight / 2;
    const horizontal = centerX < window.innerWidth / 2 ? "left" : "right";
    const vertical = centerY < window.innerHeight / 2 ? "top" : "bottom";
    setCameraMergePosition(`${vertical}-${horizontal}` as CameraMergePosition);
  }, [cameraPreviewHeight, cameraPreviewSize]);

  const startDraggingCameraPreview = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const preview = cameraPreviewContainerRef.current;
    if (!preview) return;

    event.preventDefault();
    const rect = preview.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const maxLeft = Math.max(24, window.innerWidth - rect.width - 24);
    const maxTop = Math.max(24, window.innerHeight - rect.height - 24);

    setCameraPreviewDragging(true);
    setCameraPreviewPosition({ left: rect.left, top: rect.top });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextLeft = Math.min(Math.max(24, moveEvent.clientX - offsetX), maxLeft);
      const nextTop = Math.min(Math.max(24, moveEvent.clientY - offsetY), maxTop);
      setCameraPreviewPosition({ left: nextLeft, top: nextTop });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const nextLeft = Math.min(Math.max(24, upEvent.clientX - offsetX), maxLeft);
      const nextTop = Math.min(Math.max(24, upEvent.clientY - offsetY), maxTop);
      syncCameraMergePositionFromViewport(nextLeft, nextTop);
      setCameraPreviewDragging(false);
      setCameraPreviewPosition(null);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }, [syncCameraMergePositionFromViewport]);

  const browserName = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("edg")) return "Edge";
    if (ua.includes("opr") || ua.includes("opera")) return "Opera";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
    if (ua.includes("chrome")) return "Chrome";
    return "Unknown";
  }, []);

  const supportsCapture = useMemo(
    () =>
      Boolean(
        navigator.mediaDevices?.getDisplayMedia &&
          navigator.mediaDevices?.getUserMedia &&
          typeof MediaRecorder !== "undefined",
      ),
    [],
  );

  const stopAllStreams = () => {
    [displayStreamRef, cameraStreamRef, micStreamRef, mixedStreamRef].forEach((ref) => {
      ref.current?.getTracks().forEach((t) => t.stop());
      ref.current = null;
    });
    if (drawLoopRef.current != null) cancelAnimationFrame(drawLoopRef.current);
    drawLoopRef.current = null;
    if (hiddenDrawTimeoutRef.current) clearTimeout(hiddenDrawTimeoutRef.current);
    hiddenDrawTimeoutRef.current = null;
    if (screenPreviewRef.current) screenPreviewRef.current.srcObject = null;
    if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    screenSourceVideoRef.current = null;
    cameraSourceVideoRef.current = null;
    setSelectedSurface(null);
    setSystemAudioDetected(null);
  };

  const safeDeleteDraft = useCallback(async (recordingId: number) => {
    try {
      await recordingsApi.delete(recordingId);
    } catch {
      // Ignore cleanup failures; recording draft will be cleaned server-side eventually.
    }
  }, []);

  const getSafeTitle = () => {
    const safeTitle = title.trim() || `Recording ${new Date().toLocaleString()}`;
    setTitle(safeTitle);
    return safeTitle;
  };

  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const closeDetachedControlsWindow = useCallback(() => {
    const pipWindow = controlsPipWindowRef.current;
    controlsPipWindowRef.current = null;
    setDetachedControlsActive(false);
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
    }
  }, []);

  const exitNativeCameraPictureInPicture = useCallback(async () => {
    if (typeof document === "undefined") return;
    if (!document.pictureInPictureElement) {
      nativeCameraPipActiveRef.current = false;
      return;
    }
    try {
      await document.exitPictureInPicture();
    } catch {
      // Ignore PiP close failures.
    } finally {
      nativeCameraPipActiveRef.current = false;
      setFloatingPreviewMode("inline");
    }
  }, []);

  const renderDetachedControlsWindow = useCallback(() => {
    const pipWindow = controlsPipWindowRef.current;
    if (!pipWindow || pipWindow.closed) return;
    const canRecord = state === "recording";
    const canPause = state === "paused";
    const doc = pipWindow.document;
    const root = doc.getElementById("pip-root");
    if (!root) {
      doc.body.style.margin = "0";
      doc.documentElement.style.width = "100%";
      doc.documentElement.style.height = "100%";
      doc.body.style.width = "100%";
      doc.body.style.height = "100%";
      doc.body.innerHTML = `
        <div id="pip-root" style="box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:10px 12px;width:100%;height:100%;font-family:Inter,system-ui,sans-serif;background:#0b0b10;color:#fff;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div id="pip-time" style="border:1px solid #333;padding:8px 10px;border-radius:10px;min-width:62px;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;"></div>
            <button id="pip-toggle" style="padding:8px 10px;border-radius:10px;border:1px solid #333;background:#15151d;color:#fff;cursor:pointer;"></button>
            <button id="pip-restart" style="padding:8px 10px;border-radius:10px;border:1px solid #333;background:#15151d;color:#fff;cursor:pointer;">Restart</button>
            <button id="pip-stop" style="padding:8px 10px;border-radius:10px;border:1px solid #ef4444;background:#ef4444;color:#fff;cursor:pointer;">Stop</button>
          </div>
          <div id="pip-camera-shell" style="display:none;flex:1;min-height:0;border:1px solid #333;border-radius:16px;overflow:hidden;background:#000;">
            <video id="pip-camera-preview" autoplay muted playsinline style="display:block;width:100%;height:100%;background:#000;object-fit:cover;"></video>
          </div>
        </div>
      `;
      doc.getElementById("pip-toggle")?.addEventListener("click", () => {
        const s = recordingStateRef.current;
        if (s === "recording") pauseRecording();
        else if (s === "paused") resumeRecording();
      });
      doc.getElementById("pip-restart")?.addEventListener("click", () => {
        void restartRecording();
      });
      doc.getElementById("pip-stop")?.addEventListener("click", () => {
        void stopRecording();
      });
    }

    const timeNode = doc.getElementById("pip-time");
    if (timeNode) timeNode.textContent = formattedTime;
    const toggleBtn = doc.getElementById("pip-toggle");
    if (toggleBtn) toggleBtn.textContent = canRecord ? "Pause" : "Resume";

    const pipCameraShell = doc.getElementById("pip-camera-shell") as HTMLDivElement | null;
    const pipCameraPreview = doc.getElementById("pip-camera-preview") as HTMLVideoElement | null;
    if (pipCameraShell && pipCameraPreview && cameraEnabled && cameraStreamRef.current) {
      pipCameraShell.style.display = "block";
      if (pipCameraPreview.srcObject !== cameraStreamRef.current) {
        pipCameraPreview.srcObject = cameraStreamRef.current;
      }
      void pipCameraPreview.play().catch(() => {});
    } else if (pipCameraShell && pipCameraPreview) {
      pipCameraShell.style.display = "none";
      pipCameraPreview.srcObject = null;
    }
  }, [cameraEnabled, formattedTime, state]);

  const ensureDetachedControlsWindow = useCallback(async () => {
    if (typeof window === "undefined") return false;
    const dpp = (window as Window & { documentPictureInPicture?: { requestWindow: (options?: { width?: number; height?: number }) => Promise<Window> } }).documentPictureInPicture;
    if (!dpp?.requestWindow) return false;
    let pipWindow = controlsPipWindowRef.current;
    if (!pipWindow || pipWindow.closed) {
      try {
        pipWindow = await dpp.requestWindow({ width: 460, height: 280 });
      } catch {
        return false;
      }
      controlsPipWindowRef.current = pipWindow;
      setDetachedControlsActive(true);
      pipWindow.addEventListener("pagehide", () => {
        controlsPipWindowRef.current = null;
        setDetachedControlsActive(false);
      });
    }
    renderDetachedControlsWindow();
    return true;
  }, [renderDetachedControlsWindow]);

  const ensureNativeCameraPictureInPicture = useCallback(async () => {
    if (typeof document === "undefined") return false;
    const video = cameraPreviewRef.current;
    const pictureInPictureEnabled =
      "pictureInPictureEnabled" in document &&
      Boolean((document as Document & { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled);

    if (!pictureInPictureEnabled || !video || !cameraEnabled || !cameraStreamRef.current) {
      return false;
    }

    if (video.srcObject !== cameraStreamRef.current) {
      video.srcObject = cameraStreamRef.current;
    }

    try {
      await video.play();
      if (document.pictureInPictureElement !== video) {
        await video.requestPictureInPicture();
      }
      nativeCameraPipActiveRef.current = true;
      setFloatingPreviewMode("native-pip");
      return true;
    } catch {
      nativeCameraPipActiveRef.current = false;
      setFloatingPreviewMode("inline");
      return false;
    }
  }, [cameraEnabled]);

  const resetToIdle = () => {
    clearCountdown();
    setCountdownOpen(false);
    setCountdown(3);
    setPendingDraftId(null);
    setPendingDraftTitle("");
    setElapsed(0);
    setState("idle");
    recorderRef.current = null;
    cameraRecorderRef.current = null;
    uploadSessionRef.current = null;
    cameraUploadSessionRef.current = null;
    stopAllStreams();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const createDraft = async () => {
    const safeTitle = getSafeTitle();
    const draft = await recordingsApi.create(safeTitle);
    const recordingId = Number(draft?.recording?.id ?? draft?.id ?? draft?.data?.id);
    if (Number.isNaN(recordingId)) {
      throw new Error("Unable to create recording draft: missing id in response.");
    }
    trackClientEvent({
      eventType: "recording_created",
      eventName: "recording_draft_created",
      metadata: { recordingId, route: "/record" },
    });
    return { recordingId, safeTitle };
  };

  const updateMicTrackEnabled = (enabled: boolean) => {
    micStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  };

  const extractPresignedUrl = (payload: unknown, partNumber: number) => {
    const directResultUrl = (payload as any)?.result?.[0]?.url;
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
  };

  const getPresignedUrlForPart = async (
    recordingId: number,
    uploadId: string,
    partNumber: number,
    chunkSize: number,
  ) => {
    const res = await recordingsApi.getPresignedUrls(
      recordingId,
      uploadId,
      [partNumber],
      chunkSize,
    );
    return extractPresignedUrl(res, partNumber);
  };

  const getCameraPresignedUrlForPart = async (
    recordingId: number,
    uploadId: string,
    workspaceId: string,
    partNumber: number,
  ) => {
    const res = await recordingsApi.getCameraTrackPresignedUrls(
      recordingId,
      uploadId,
      { workspaceId, partNumbers: [partNumber] },
    );
    return extractPresignedUrl(res, partNumber);
  };

  const recordingMimeType = useMemo(
    () =>
      MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : MediaRecorder.isTypeSupported("video/mp4")
            ? "video/mp4"
          : "video/webm",
    [],
  );

  const recordingExtension = useMemo(
    () => (recordingMimeType.includes("mp4") ? "mp4" : "webm"),
    [recordingMimeType],
  );

  const processUploadQueue = useCallback(
    async (contentType: string) => {
      const session = uploadSessionRef.current;
      if (!session || session.uploading) return;
      session.uploading = true;
      try {
        while (session.queue.length > 0) {
          const chunk = session.queue.shift();
          if (!chunk) continue;
          const partNumber = session.nextPart;
          const url = await getPresignedUrlForPart(
            session.recordingId,
            session.uploadId,
            partNumber,
            chunk.size,
          );
          const putRes = await fetch(url, {
            method: "PUT",
            body: chunk,
            headers: { "Content-Type": contentType },
          });
          if (!putRes.ok) throw new Error(`Failed to upload part ${partNumber}`);
          const eTag = (putRes.headers.get("ETag") || `part-${partNumber}`).replace(/"/g, "");
          session.uploadedParts.push({ partNumber, eTag });
          session.nextPart = partNumber + 1;
        }
        if (session.doneCollecting && session.resolveDrain) {
          session.resolveDrain();
          session.resolveDrain = undefined;
        }
      } finally {
        session.uploading = false;
      }
    },
    [],
  );

  const waitForUploadDrain = () =>
    new Promise<void>((resolve) => {
      const session = uploadSessionRef.current;
      if (!session || (!session.uploading && session.queue.length === 0)) {
        resolve();
        return;
      }
      session.resolveDrain = resolve;
    });

  const processCameraUploadQueue = useCallback(async () => {
    const session = cameraUploadSessionRef.current;
    if (!session || session.uploading) return;
    session.uploading = true;
    try {
      while (session.queue.length > 0) {
        const chunk = session.queue.shift();
        if (!chunk) continue;
        const partNumber = session.nextPart;
        const url = await getCameraPresignedUrlForPart(
          session.recordingId,
          session.uploadId,
          session.workspaceId,
          partNumber,
        );
        const putRes = await fetch(url, {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": session.contentType },
        });
        if (!putRes.ok) throw new Error(`Failed to upload camera part ${partNumber}`);
        const eTag = (putRes.headers.get("ETag") || `camera-part-${partNumber}`).replace(/"/g, "");
        session.uploadedParts.push({ partNumber, eTag });
        session.nextPart = partNumber + 1;
      }
      if (session.doneCollecting && session.resolveDrain) {
        session.resolveDrain();
        session.resolveDrain = undefined;
      }
    } finally {
      session.uploading = false;
    }
  }, []);

  const waitForCameraUploadDrain = () =>
    new Promise<void>((resolve) => {
      const session = cameraUploadSessionRef.current;
      if (!session || (!session.uploading && session.queue.length === 0)) {
        resolve();
        return;
      }
      session.resolveDrain = resolve;
    });

  const flushBufferedChunkToQueue = useCallback(
    (contentType: string, force = false) => {
      const session = uploadSessionRef.current;
      if (!session) return;

      const takeFromBuffer = (targetSize: number) => {
        let remaining = targetSize;
        const parts: Blob[] = [];
        while (remaining > 0 && session.bufferedChunks.length > 0) {
          const current = session.bufferedChunks[0];
          if (current.size <= remaining) {
            parts.push(current);
            session.bufferedChunks.shift();
            session.bufferedBytes -= current.size;
            remaining -= current.size;
          } else {
            parts.push(current.slice(0, remaining));
            session.bufferedChunks[0] = current.slice(remaining);
            session.bufferedBytes -= remaining;
            remaining = 0;
          }
        }
        return new Blob(parts, { type: contentType });
      };

      while (session.bufferedBytes >= TARGET_UPLOAD_CHUNK_SIZE) {
        session.queue.push(takeFromBuffer(TARGET_UPLOAD_CHUNK_SIZE));
      }

      if (force && session.bufferedBytes > 0) {
        session.queue.push(takeFromBuffer(session.bufferedBytes));
      }

      if (session.queue.length > 0) {
        void processUploadQueue(contentType);
      }
    },
    [processUploadQueue],
  );

  const flushBufferedCameraChunkToQueue = useCallback((force = false) => {
    const session = cameraUploadSessionRef.current;
    if (!session) return;

    const takeFromBuffer = (targetSize: number) => {
      let remaining = targetSize;
      const parts: Blob[] = [];
      while (remaining > 0 && session.bufferedChunks.length > 0) {
        const current = session.bufferedChunks[0];
        if (current.size <= remaining) {
          parts.push(current);
          session.bufferedChunks.shift();
          session.bufferedBytes -= current.size;
          remaining -= current.size;
        } else {
          parts.push(current.slice(0, remaining));
          session.bufferedChunks[0] = current.slice(remaining);
          session.bufferedBytes -= remaining;
          remaining = 0;
        }
      }
      return new Blob(parts, { type: session.contentType });
    };

    while (session.bufferedBytes >= TARGET_UPLOAD_CHUNK_SIZE) {
      session.queue.push(takeFromBuffer(TARGET_UPLOAD_CHUNK_SIZE));
    }

    if (force && session.bufferedBytes > 0) {
      session.queue.push(takeFromBuffer(session.bufferedBytes));
    }

    if (session.queue.length > 0) {
      void processCameraUploadQueue();
    }
  }, [processCameraUploadQueue]);

  const abortCameraUploadIfNeeded = useCallback(async () => {
    const cameraSession = cameraUploadSessionRef.current;
    if (!cameraSession) return;
    try {
      await recordingsApi.abortCameraTrackUpload(
        cameraSession.recordingId,
        cameraSession.uploadId,
      );
    } catch {
      // Ignore abort errors.
    }
  }, []);

  const abortMainUploadIfNeeded = useCallback(
    async (recordingId?: number | null, uploadId?: string | null) => {
      if (!recordingId) return;
      if (uploadId) {
        try {
          await recordingsApi.abortUpload(recordingId, uploadId);
          return;
        } catch {
          // Fall through to server-stored upload id.
        }
      }
      try {
        await recordingsApi.abortMultipartUpload(recordingId);
      } catch {
        // Ignore abort errors.
      }
    },
    [],
  );

  const finalizeUpload = useCallback(
    async (recordingId: number, uploadId: string, uploadedParts: UploadedPart[]) => {
      const completeRes = await recordingsApi.completeUpload(recordingId, uploadId, {
        data: uploadedParts,
        chunkSize: TARGET_UPLOAD_CHUNK_SIZE,
      });

      const cameraSession = cameraUploadSessionRef.current;
      if (cameraSession && cameraSession.uploadedParts.length > 0) {
        try {
          await recordingsApi.completeCameraTrackUpload(
            recordingId,
            cameraSession.uploadId,
            {
              workspaceId: cameraSession.workspaceId,
              data: cameraSession.uploadedParts,
            },
          );
        } catch {
          toast({
            title: "Camera track upload failed",
            description:
              "Screen recording was saved, but camera track completion failed. You can retry camera processing in backend.",
            variant: "destructive",
          });
        }
      }
      setState("processing");
      toastApiSuccess(completeRes, {
        title: "Upload complete",
        fallbackDescription: "Your recording is being processed.",
      });
      trackClientEvent({
        eventType: "recording_completed",
        eventName: "recording_upload_finalized",
        metadata: { recordingId, route: "/record" },
      });
      stopAllStreams();
      setTimeout(() => navigate(`/recording/${recordingId}`), 1200);
    },
    [navigate, toast],
  );

  const startRecording = async (draftInfo?: { recordingId: number; safeTitle: string }) => {
    if (preparing) return;
    setPreparing(true);
    let recordingId = draftInfo?.recordingId ?? null;
    let safeTitle = draftInfo?.safeTitle ?? "";
    let initiatedMainUploadId: string | undefined;
    try {
      if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
        throw new Error("This browser does not support screen recording.");
      }
      const selectedWorkspaceId = getSelectedWorkspaceId();
      if (!selectedWorkspaceId) {
        setWorkspaceAlertOpen(true);
        setState("idle");
        return;
      }
      if (!recordingId) {
        const draft = await createDraft();
        recordingId = draft.recordingId;
        safeTitle = draft.safeTitle;
      }
      const displaySurfaceMap: Record<ShareTarget, "monitor" | "window" | "browser"> = {
        screen: "monitor",
        window: "window",
        tab: "browser",
      };
      const displayOptions = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
          displaySurface: displaySurfaceMap[shareTarget],
        },
        audio: shareSystemSound
          ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
            }
          : false,
        preferCurrentTab: shareTarget === "tab",
      } as DisplayMediaStreamOptions & { preferCurrentTab?: boolean };
      const displayStream = await navigator.mediaDevices.getDisplayMedia(displayOptions);
      displayStreamRef.current = displayStream;


      const displayTrack = displayStream.getVideoTracks()[0];

      await displayTrack.applyConstraints({
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      });

      const displaySurface = (displayTrack?.getSettings() as any)?.displaySurface as
        | "monitor"
        | "window"
        | "browser"
        | undefined;
      setSelectedSurface(displaySurface ?? "unknown");
      const displayAudioTracks = displayStream.getAudioTracks();
      setSystemAudioDetected(displayAudioTracks.length > 0);
      if (shareSystemSound && displayAudioTracks.length === 0) {
        toast({
          title: "No system/tab audio captured",
          description:
            "To capture YouTube sound, share a browser tab/window with audio enabled in the share dialog.",
        });
      }

      let camStream: MediaStream | null = null;
      if (cameraEnabled) {
        try {
          camStream = await navigator.mediaDevices.getUserMedia({ video: true });
          cameraStreamRef.current = camStream;
        } catch {
          setCameraEnabled(false);
          toast({ title: "Camera unavailable", description: "Recording continues without camera." });
        }
      }

      let micStream: MediaStream | null = null;
      if (micEnabled) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = micStream;
        } catch {
          setMicEnabled(false);
          toast({ title: "Microphone unavailable", description: "Recording continues without mic." });
        }
      }

      if (screenPreviewRef.current) {
        screenPreviewRef.current.srcObject = displayStream;
        void screenPreviewRef.current.play().catch(() => {});
      }
      if (cameraPreviewRef.current && camStream) {
        cameraPreviewRef.current.srcObject = camStream;
        void cameraPreviewRef.current.play().catch(() => {});
      }

    
      const screenVideo = document.createElement("video");
      screenVideo.srcObject = displayStream;
      screenVideo.muted = true;
      await screenVideo.play();
      screenSourceVideoRef.current = screenVideo;

      const camVideo = document.createElement("video");
      if (camStream) {
        camVideo.srcObject = camStream;
        camVideo.muted = true;
        await camVideo.play();
      }
      cameraSourceVideoRef.current = camVideo;


      // Follow a simpler and more browser-friendly pattern:
      // combine recorded video track with available display+mic audio tracks.
      const mixed = new MediaStream([...displayStream.getVideoTracks()]);
      const hasDisplayAudio = displayAudioTracks.length > 0;
      const hasMicAudio = Boolean(micStream?.getAudioTracks().length);
      if (hasDisplayAudio || hasMicAudio) {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        audioContextRef.current = audioContext;

        if (hasDisplayAudio) {
          const displaySource = audioContext.createMediaStreamSource(displayStream);
          const displayGain = audioContext.createGain();
          displayGain.gain.value = 0.9;
          displaySource.connect(displayGain).connect(destination);
        }

        if (micStream) {
          micStream.getAudioTracks().forEach((track) => {
            track.enabled = micEnabled;
          });
          const micSource = audioContext.createMediaStreamSource(micStream);
          const micGain = audioContext.createGain();
          micGain.gain.value = 1.2;
          micSource.connect(micGain).connect(destination);
        }

        destination.stream.getAudioTracks().forEach((track) => mixed.addTrack(track));
      }
      if (mixed.getVideoTracks().length === 0) {
        throw new Error("No video track available in recording stream.");
      }
      mixedStreamRef.current = mixed;

      const init = await recordingsApi.initUpload(recordingId, {
        fileName: `${safeTitle}.${recordingExtension}`,
        contentType: recordingMimeType,
      });
      if (!init?.uploadId) throw new Error("Unable to initialize upload session.");
      initiatedMainUploadId = init.uploadId;
      uploadSessionRef.current = {
        recordingId,
        uploadId: init.uploadId,
        nextPart: 1,
        queue: [],
        bufferedChunks: [],
        bufferedBytes: 0,
        uploadedParts: [],
        uploading: false,
        doneCollecting: false,
      };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(mixed, {
          mimeType: recordingMimeType,
          videoBitsPerSecond: 20_000_000,
          audioBitsPerSecond: 192_000,
        });
      } catch {
        recorder = new MediaRecorder(mixed);
      }
      recorderRef.current = recorder;
      cameraUploadSessionRef.current = null;
      if (camStream) {
        let cameraRecorder: MediaRecorder;
        const cameraMimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
            ? "video/webm;codecs=vp9"
            : MediaRecorder.isTypeSupported("video/mp4")
              ? "video/mp4"
              : "video/webm";
        const cameraExtension = cameraMimeType.includes("mp4") ? "mp4" : "webm";
        const cameraInit = await recordingsApi.initCameraTrackUpload(recordingId, {
          fileName: `${safeTitle}-camera.${cameraExtension}`,
          contentType: cameraMimeType,
          durationSec: 0,
          workspaceId: selectedWorkspaceId,
          cameraPosition: cameraMergePosition,
          cameraShape: cameraMergeShape,
          cameraScale: cameraMergeScale,
        });
        if (!cameraInit?.uploadId) {
          throw new Error("Unable to initialize camera upload session.");
        }
        cameraUploadSessionRef.current = {
          recordingId,
          uploadId: cameraInit.uploadId,
          workspaceId: selectedWorkspaceId,
          contentType: cameraMimeType,
          nextPart: 1,
          queue: [],
          bufferedChunks: [],
          bufferedBytes: 0,
          uploadedParts: [],
          uploading: false,
          doneCollecting: false,
        };
        try {
          cameraRecorder = new MediaRecorder(camStream, {
            mimeType: cameraMimeType,
            videoBitsPerSecond: 8_000_000,
          });
        } catch {
          cameraRecorder = new MediaRecorder(camStream);
        }
        cameraRecorder.ondataavailable = (event) => {
          if (!event.data || event.data.size === 0) return;
          const cameraSession = cameraUploadSessionRef.current;
          if (!cameraSession) return;
          cameraSession.bufferedChunks.push(event.data);
          cameraSession.bufferedBytes += event.data.size;
          flushBufferedCameraChunkToQueue();
        };
        cameraRecorderRef.current = cameraRecorder;
        cameraRecorder.start(CHUNK_TIMESLICE_MS);
      } else {
        cameraRecorderRef.current = null;
      }
      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size === 0) return;
        const session = uploadSessionRef.current;
        if (!session) return;
        session.bufferedChunks.push(event.data);
        session.bufferedBytes += event.data.size;
        flushBufferedChunkToQueue(recordingMimeType);
      };
      recorder.start(CHUNK_TIMESLICE_MS);
      setState("recording");
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);

      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          void stopRecording();
        });
      }
    } catch (err: any) {
      toast({
        title: "Could not start recording",
        description: err?.message || "Please check permissions and try again.",
        variant: "destructive",
      });
      stopAllStreams();
      await abortMainUploadIfNeeded(recordingId, initiatedMainUploadId ?? null);
      await abortCameraUploadIfNeeded();
      if (recordingId) {
        await safeDeleteDraft(recordingId);
      }
      uploadSessionRef.current = null;
      cameraRecorderRef.current = null;
      cameraUploadSessionRef.current = null;
      setState("idle");
    } finally {
      setPendingDraftId(null);
      setPendingDraftTitle("");
      setPreparing(false);
    }
  };

  const stopRecording = async () => {
    if (state !== "recording" && state !== "paused") return;
    setState("stopping");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const session = uploadSessionRef.current;
    const recorder = recorderRef.current;
    const cameraRecorder = cameraRecorderRef.current;
    const cameraSession = cameraUploadSessionRef.current;
    if (!session || !recorder) {
      setState("idle");
      stopAllStreams();
      return;
    }
    try {
      const waitMainRecorderStop = new Promise<void>((resolve) => {
        const onStop = () => resolve();
        recorder.addEventListener("stop", onStop, { once: true });
        recorder.stop();
      });
      const waitCameraRecorderStop =
        cameraRecorder && cameraRecorder.state !== "inactive"
          ? new Promise<void>((resolve) => {
              cameraRecorder.addEventListener("stop", () => resolve(), {
                once: true,
              });
              cameraRecorder.stop();
            })
          : Promise.resolve();
      await Promise.all([waitMainRecorderStop, waitCameraRecorderStop]);
      session.doneCollecting = true;
      if (cameraSession) cameraSession.doneCollecting = true;
      flushBufferedChunkToQueue(recordingMimeType, true);
      flushBufferedCameraChunkToQueue(true);
      await processUploadQueue(recordingMimeType);
      await processCameraUploadQueue();
      await waitForUploadDrain();
      await waitForCameraUploadDrain();
      if (session.uploadedParts.length === 0) {
        throw new Error("No media data was captured.");
      }
      await finalizeUpload(session.recordingId, session.uploadId, session.uploadedParts);
    } catch (err: any) {
      toast({
        title: "Upload interrupted",
        description:
          err?.message ||
          "Chunks already in the cloud can be finished below or from another device. Anything not uploaded is lost.",
        variant: "destructive",
      });
      void refreshUploadingDrafts();
      setState("idle");
      stopAllStreams();
    } finally {
      recorderRef.current = null;
      cameraRecorderRef.current = null;
      uploadSessionRef.current = null;
      cameraUploadSessionRef.current = null;
    }
  };

  const restartRecording = async () => {
    if (state !== "recording" && state !== "paused") return;
    const mainSession = uploadSessionRef.current;
    const currentRecordingId = mainSession?.recordingId;
    const mainUploadId = mainSession?.uploadId;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.ondataavailable && (recorderRef.current.ondataavailable = () => {});
    cameraRecorderRef.current?.ondataavailable && (cameraRecorderRef.current.ondataavailable = () => {});
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (cameraRecorderRef.current && cameraRecorderRef.current.state !== "inactive") {
        cameraRecorderRef.current.stop();
      }
    } catch {
      // noop
    }
    recorderRef.current = null;
    cameraRecorderRef.current = null;
    uploadSessionRef.current = null;
    await abortMainUploadIfNeeded(currentRecordingId, mainUploadId);
    await abortCameraUploadIfNeeded();
    cameraUploadSessionRef.current = null;
    stopAllStreams();
    setState("idle");
    setElapsed(0);
    if (currentRecordingId) {
      await safeDeleteDraft(currentRecordingId);
    }
    setShareDialogOpen(true);
  };

  const handleMicPermissionToggle = async (checked: boolean) => {
    if (!checked) {
      setMicEnabled(false);
      setMicPermission("prompt");
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
      setMicEnabled(true);
    } catch {
      setMicPermission("denied");
      setMicEnabled(false);
      toast({
        title: "Microphone permission denied",
        description: "Allow microphone access from browser site permissions to enable it.",
      });
    }
  };

  const handleCameraPermissionToggle = async (checked: boolean) => {
    if (!checked) {
      setCameraEnabled(false);
      setCameraPermission("prompt");
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraPermission("granted");
      setCameraEnabled(true);
    } catch {
      setCameraPermission("denied");
      setCameraEnabled(false);
      toast({
        title: "Camera permission denied",
        description: "Allow camera access from browser site permissions to enable it.",
      });
    }
  };

  const pauseRecording = () => {
    // Use recordingStateRef so callers from stale closures (e.g. PiP window listeners attached once) see current state.
    if (recordingStateRef.current !== "recording" || !recorderRef.current) return;
    const rec = recorderRef.current;
    const cam = cameraRecorderRef.current;
    try {
      if (rec.state === "recording") {
        rec.pause();
      }
      if (cam?.state === "recording") {
        cam.pause();
      }
    } catch (err: any) {
      toast({
        title: "Could not pause",
        description: err?.message || "Try stopping the recording instead.",
        variant: "destructive",
      });
      return;
    }
    if (rec.state !== "paused") {
      toast({
        title: "Pause not supported",
        description:
          "This browser or recording format does not support pause. Use Stop to finish, or try Chrome with WebM.",
      });
      return;
    }
    setState("paused");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resumeRecording = () => {
    if (recordingStateRef.current !== "paused" || !recorderRef.current) return;
    const rec = recorderRef.current;
    const cam = cameraRecorderRef.current;
    try {
      if (rec.state === "paused") {
        rec.resume();
      }
      if (cam?.state === "paused") {
        cam.resume();
      }
    } catch (err: any) {
      if (rec.state === "recording") {
        setState("recording");
        if (!timerRef.current) {
          timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
        }
        return;
      }
      toast({
        title: "Could not resume",
        description: err?.message || "Try stopping and starting a new recording.",
        variant: "destructive",
      });
      return;
    }
    if (rec.state !== "recording") {
      toast({
        title: "Could not resume",
        description: "The recorder did not return to an active state. Try stopping the recording.",
        variant: "destructive",
      });
      return;
    }
    setState("recording");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
  };

  const toggleMicLive = async () => {
    if (state === "idle") {
      setMicEnabled((prev) => !prev);
      return;
    }
    const next = !micEnabled;
    setMicEnabled(next);
    updateMicTrackEnabled(next);
  };

  useEffect(() => {
    recordingStateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state === "idle") {
      setCameraPreviewDragging(false);
      setCameraPreviewPosition(null);
    }
  }, [state]);

  useEffect(() => {
    return () => {
      clearCountdown();
      closeDetachedControlsWindow();
      void exitNativeCameraPictureInPicture();
      if (timerRef.current) clearInterval(timerRef.current);
      stopAllStreams();
    };
  }, [closeDetachedControlsWindow, exitNativeCameraPictureInPicture]);

  useEffect(() => {
    const updatePermissions = async () => {
      if (!navigator.permissions?.query) {
        setMicPermission("unsupported");
        setCameraPermission("unsupported");
        return;
      }
      try {
        const [mic, cam] = await Promise.all([
          navigator.permissions.query({ name: "microphone" as PermissionName }),
          navigator.permissions.query({ name: "camera" as PermissionName }),
        ]);
        setMicPermission(mic.state);
        setCameraPermission(cam.state);
      } catch {
        setMicPermission("unknown");
        setCameraPermission("unknown");
      }
    };
    void updatePermissions();
  }, []);

  useEffect(() => {
    if (!countdownOpen) return;
    clearCountdown();
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearCountdown;
  }, [countdownOpen]);

  useEffect(() => {
    if (countdown !== 0 || !pendingDraftId || !pendingDraftTitle) return;
    setCountdownOpen(false);
    void startRecording({ recordingId: pendingDraftId, safeTitle: pendingDraftTitle });
  }, [countdown, pendingDraftId, pendingDraftTitle]);

  useEffect(() => {
    if (state !== "recording" && state !== "paused") {
      closeDetachedControlsWindow();
      void exitNativeCameraPictureInPicture();
      return;
    }
    void ensureDetachedControlsWindow();
  }, [
    state,
    ensureDetachedControlsWindow,
    closeDetachedControlsWindow,
    exitNativeCameraPictureInPicture,
  ]);

  useEffect(() => {
    if (!detachedControlsActive) return;
    renderDetachedControlsWindow();
  }, [detachedControlsActive, formattedTime, state, renderDetachedControlsWindow]);

  useEffect(() => {
    const onLeavePictureInPicture = () => {
      nativeCameraPipActiveRef.current = false;
      setFloatingPreviewMode("inline");
    };

    const video = cameraPreviewRef.current;
    video?.addEventListener("leavepictureinpicture", onLeavePictureInPicture);
    return () => {
      video?.removeEventListener("leavepictureinpicture", onLeavePictureInPicture);
    };
  }, [state, cameraEnabled]);

  useEffect(() => {
    cameraEnabledRef.current = cameraEnabled;
  }, [cameraEnabled]);

  useEffect(() => {
    if (state === "idle") return;
    if (screenPreviewRef.current && displayStreamRef.current) {
      screenPreviewRef.current.srcObject = displayStreamRef.current;
      void screenPreviewRef.current.play().catch(() => {});
    }
    if (cameraPreviewRef.current && cameraEnabled && cameraStreamRef.current) {
      cameraPreviewRef.current.srcObject = cameraStreamRef.current;
      void cameraPreviewRef.current.play().catch(() => {});
    }
  }, [state, cameraEnabled]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state !== "recording" && state !== "paused" && state !== "stopping") return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (screenPreviewRef.current && displayStreamRef.current) {
        screenPreviewRef.current.srcObject = displayStreamRef.current;
        void screenPreviewRef.current.play().catch(() => {});
      }
      if (cameraPreviewRef.current && cameraEnabled && cameraStreamRef.current) {
        cameraPreviewRef.current.srcObject = cameraStreamRef.current;
        void cameraPreviewRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [cameraEnabled]);

  const discardIncompleteUpload = useCallback(
    async (recordingId: number) => {
      try {
        await recordingsApi.abortMultipartUpload(recordingId);
      } catch {
        /* ignore */
      }
      setUploadingDrafts((prev) => prev.filter((x) => x.id !== recordingId));
      void refreshUploadingDrafts();
      toast({
        title: "Discarded",
        description: "Multipart session aborted on the server.",
      });
    },
    [toast, refreshUploadingDrafts],
  );

  const runResumeScreenJob = useCallback(
    async (recordingId: number) => {
      setScreenResuming(true);
      setResumeProgress(0);
      try {
        await resumeScreenRecordingFromServer(recordingId, {
          onProgress: (pct) => setResumeProgress(pct),
        });
        toast({ title: "Upload complete", description: "Your recording is being processed." });
        setState("processing");
        setTimeout(() => navigate(`/recording/${recordingId}`), 1200);
        void refreshUploadingDrafts();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Try again.";
        toast({ title: "Resume failed", description: msg, variant: "destructive" });
      } finally {
        setScreenResuming(false);
      }
    },
    [navigate, toast, refreshUploadingDrafts],
  );

  useEffect(() => {
    void refreshUploadingDrafts();
  }, [state, screenResuming, refreshUploadingDrafts]);

  useEffect(() => {
    const id = searchParams.get("resumeScreenId");
    if (!id) return;
    const rid = Number(id);
    if (!Number.isFinite(rid)) return;
    void (async () => {
      try {
        const listRes = await recordingsApi.myRecordings({
          limit: 200,
          page: 1,
          filters: { status: "uploading" },
        });
        const rows =
          (listRes as { recordings?: { id?: number; title?: string }[] }).recordings ??
          (listRes as { data?: { id?: number; title?: string }[] }).data ??
          [];
        const rec = rows.find((r) => Number(r.id) === rid);
        toast({
          title: "Recording still uploading",
          description: rec?.title
            ? `Finish «${rec.title}» below. You can also open this page on another signed-in device.`
            : `Finish recording #${rid} below when possible.`,
        });
      } catch {
        toast({
          title: "Recording still uploading",
          description: `Finish recording #${rid} below when possible.`,
        });
      }
      setSearchParams({});
    })();
  }, [searchParams, setSearchParams, toast]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Record Screen</h1>
          <p className="text-muted-foreground">
            1080p screen recording with webcam/mic controls and robust upload.
          </p>
        </div>

        {uploadingDrafts.length > 0 && (
          <Card className="glass border-amber-500/35">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold">
                Uploads in progress — finish screen and/or camera multipart from parts already in the cloud
              </p>
              <ul className="space-y-2">
                {uploadingDrafts.map((job) => (
                  <li
                    key={job.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="truncate">
                      {job.title ?? `Recording #${job.id}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={screenResuming}
                        onClick={() => void runResumeScreenJob(job.id)}
                      >
                        {screenResuming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Finish upload
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={screenResuming}
                        onClick={() => void discardIncompleteUpload(job.id)}
                      >
                        Discard
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {screenResuming && (
                <div className="space-y-1">
                  <Progress value={resumeProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{resumeProgress}%</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {state === "idle" && (
          <Card className="glass border-primary/20">
            <CardContent className="p-5 space-y-2">
              <p className="text-sm font-semibold">Pre-record checklist</p>
              <p className="text-sm text-muted-foreground">
                Browser: {browserName}. You can share an entire screen, a window, or a browser tab.
              </p>
              <div className="text-sm space-y-1">
                {/* <p>• Capture support: {supportsCapture ? "Ready" : "Not supported in this browser"}</p>
                <p>• Output quality: 1080p (1920x1080)</p>
                <p>• Audio: microphone + shared screen/tab audio (if provided by browser/OS)</p> */}
                <p className="rounded-md p-3 text-indigo-600 font-bold bg-indigo-400/25">
                  • Tip: to capture website audio, share the browser tab and enable audio in the share dialog
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass">
          <CardContent className="p-6 space-y-5">
            {(state === "recording" || state === "paused") && (
              <div className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>Surface: {selectedSurface || "unknown"}</span>
                <span>System audio: {systemAudioDetected ? "detected" : "not detected"}</span>
                <span>Resolution: 1920x1080</span>
                {cameraEnabled && (
                  <span>
                    Camera preview:{" "}
                    {floatingPreviewMode === "native-pip"
                        ? "picture-in-picture"
                        : "in page"}
                  </span>
                )}
              </div>
            )}
            {state !== "idle" && (
              <div className="grid gap-4 md:grid-cols-1">
                <div className="space-y-2">
                  <Label>Main preview (Screen)</Label>
                  <video
                    ref={screenPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-xl bg-black aspect-video"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button
                type="button"
                variant={micEnabled ? "default" : "outline"}
                className={cn(micEnabled ? "gradient-primary" : "")}
                onClick={() => void toggleMicLive()}
              >
                {micEnabled ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                {micEnabled ? "Mic On" : "Mic Off"}
              </Button>
              <div className="rounded-md border border-border px-3 py-2 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-mono">{formattedTime}</span>
              </div>
              {(state === "recording" || state === "paused") && cameraEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void ensureNativeCameraPictureInPicture()}
                >
                  <Video className="h-4 w-4 mr-2" />
                  {floatingPreviewMode === "inline" ? "Pop out camera" : "Reopen camera popout"}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Recording title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Recording title"
                disabled={state !== "idle"}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {state === "idle" && (
                <Button
                  className="gradient-primary"
                  onClick={() => {
                    trackClientEvent({
                      eventType: "click",
                      eventName: "record_open_share_dialog",
                      metadata: { route: "/record" },
                    });
                    setShareDialogOpen(true);
                  }}
                  disabled={preparing}
                >
                  {preparing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Monitor className="h-4 w-4 mr-2" />}
                  Start Recording
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(state === "recording" || state === "paused") && !detachedControlsActive && (
        <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2">
          <div className="rounded-2xl border border-border bg-card/95 backdrop-blur px-4 py-3 shadow-2xl flex items-center gap-2">
            <div className="rounded-lg border px-3 py-2 text-sm font-mono">{formattedTime}</div>
            {state === "recording" ? (
              <Button variant="outline" size="sm" onClick={pauseRecording}>
                <Pause className="h-4 w-4 mr-1.5" /> Pause
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={resumeRecording}>
                <Play className="h-4 w-4 mr-1.5" /> Resume
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void restartRecording()}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Restart
            </Button>
            <Button variant="destructive" size="sm" onClick={() => void stopRecording()}>
              <Square className="h-4 w-4 mr-1.5" /> Stop
            </Button>
          </div>
        </div>
      )}

      {(state === "recording" || state === "paused") && cameraEnabled && !detachedControlsActive && (
        <div
          ref={cameraPreviewContainerRef}
          className={cn("fixed z-[9998]", !cameraPreviewPosition && cameraPreviewPlacementClass)}
          style={
            cameraPreviewPosition
              ? {
                  left: `${cameraPreviewPosition.left}px`,
                  top: `${cameraPreviewPosition.top}px`,
                }
              : undefined
          }
        >
          <div
            className="rounded-2xl border border-border bg-card/95 backdrop-blur p-2 shadow-2xl overflow-hidden resize"
            style={{
              width: `${cameraPreviewSize + 16}px`,
              height: `${cameraPreviewHeight + 16}px`,
              minWidth: "180px",
              minHeight: "120px",
              maxWidth: "45vw",
              maxHeight: "45vh",
            }}
          >
            <div
              className={cn(
                "mb-2 rounded-lg border border-border/60 bg-background/70 px-3 py-1.5 text-[11px] text-muted-foreground select-none touch-none",
                cameraPreviewDragging ? "cursor-grabbing" : "cursor-grab",
              )}
              onPointerDown={startDraggingCameraPreview}
            >
              Drag to move camera preview
            </div>
            <video
              ref={cameraPreviewRef}
              autoPlay
              muted
              playsInline
              className="bg-black rounded-xl object-cover w-full h-full"
            />
          </div>
        </div>
      )}

      {(state === "stopping" || state === "processing") && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-2xl border border-border bg-card px-8 py-7 shadow-2xl text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-base font-semibold">
              {state === "stopping" ? "Finalizing recording..." : "Processing recording..."}
            </p>
            <p className="text-sm text-muted-foreground">Please keep this tab open.</p>
          </div>
        </div>
      )}

      <Dialog open={workspaceAlertOpen} onOpenChange={setWorkspaceAlertOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Workspace required</DialogTitle>
            <DialogDescription>
              Please select a workspace before starting recording. If you do not have one yet, create a workspace first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkspaceAlertOpen(false)}>
              Close
            </Button>
            <Button
              className="gradient-primary"
              onClick={() => {
                setWorkspaceAlertOpen(false);
                navigate("/workspaces");
              }}
            >
              Go to Workspaces
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="gradient-primary rounded-lg p-1.5">
                <Monitor className="h-4 w-4 text-primary-foreground" />
              </div>
              ScreenFlow
            </DialogTitle>
            <DialogDescription>Choose what to share before starting recording.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Share target</Label>
            <div className="grid gap-2">
              {[
                { id: "screen", label: "Entire screen", icon: Monitor },
                { id: "window", label: "Window", icon: AppWindow },
                { id: "tab", label: "Current tab", icon: Globe },
              ].map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => setShareTarget(target.id as ShareTarget)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-left flex items-center justify-between transition-colors",
                    shareTarget === target.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <target.icon className="h-4 w-4" />
                    {target.label}
                  </span>
                  {shareTarget === target.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border px-3 py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium flex items-center gap-2">
                {shareSystemSound ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                Share system sound
              </p>
              <p className="text-xs text-muted-foreground">Enabled by default for tab/system audio capture.</p>
            </div>
            <Switch checked={shareSystemSound} onCheckedChange={setShareSystemSound} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary"
              onClick={() => {
                trackClientEvent({
                  eventType: "click",
                  eventName: "record_share_dialog_continue",
                  metadata: { route: "/record", shareTarget },
                });
                setShareDialogOpen(false);
                setPermissionsDialogOpen(true);
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Permissions</DialogTitle>
            <DialogDescription>Manage microphone and camera access for this recording.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border px-3 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Mic className="h-4 w-4" /> Microphone
                </p>
                <p className="text-xs text-muted-foreground">Permission: {micPermission}</p>
              </div>
              <Switch checked={micEnabled} onCheckedChange={(checked) => void handleMicPermissionToggle(checked)} />
            </div>
            <div className="rounded-lg border px-3 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" /> Camera
                </p>
                <p className="text-xs text-muted-foreground">Permission: {cameraPermission}</p>
              </div>
              <Switch checked={cameraEnabled} onCheckedChange={(checked) => void handleCameraPermissionToggle(checked)} />
            </div>
            <div className="rounded-lg border px-3 py-3 space-y-3">
              <div>
                <p className="text-sm font-medium">Camera merge layout</p>
                <p className="text-xs text-muted-foreground">
                  These values are sent to backend so FFmpeg can compose the camera beside the screen.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["top-left", "top-right", "bottom-left", "bottom-right"] as CameraMergePosition[]).map((position) => (
                    <Button
                      key={position}
                      type="button"
                      variant={cameraMergePosition === position ? "default" : "outline"}
                      className={cn(cameraMergePosition === position ? "gradient-primary" : "")}
                      onClick={() => setCameraMergePosition(position)}
                    >
                      {position.replace("-", " ")}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Shape</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["circle", "rounded-rect"] as CameraMergeShape[]).map((shape) => (
                    <Button
                      key={shape}
                      type="button"
                      variant={cameraMergeShape === shape ? "default" : "outline"}
                      className={cn(cameraMergeShape === shape ? "gradient-primary" : "")}
                      onClick={() => setCameraMergeShape(shape)}
                    >
                      {shape === "rounded-rect" ? "Rounded rectangle" : "Circle"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Scale</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(cameraMergeScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.18"
                  max="0.4"
                  step="0.02"
                  value={cameraMergeScale}
                  onChange={(e) => setCameraMergeScale(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPermissionsDialogOpen(false);
                setShareDialogOpen(true);
              }}
            >
              Back
            </Button>
            <Button
              className="gradient-primary"
              onClick={async () => {
                trackClientEvent({
                  eventType: "click",
                  eventName: "record_start_countdown",
                  metadata: { route: "/record", micEnabled, cameraEnabled },
                });
                try {
                  const draft = await createDraft();
                  setPendingDraftId(draft.recordingId);
                  setPendingDraftTitle(draft.safeTitle);
                  setPermissionsDialogOpen(false);
                  setCountdown(3);
                  setCountdownOpen(true);
                } catch (err: any) {
                  toast({
                    title: "Could not prepare recording",
                    description: err?.message || "Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Start countdown
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={countdownOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-xs [&>button]:hidden">
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto h-28 w-28 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
              <span className="text-5xl font-bold">{countdown}</span>
            </div>
            <p className="text-sm text-muted-foreground">Recording starts shortly.</p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => {
                const draftId = pendingDraftId;
                resetToIdle();
                if (draftId) {
                  await safeDeleteDraft(draftId);
                }
                toast({ title: "Countdown cancelled", description: "Draft recording removed." });
              }}
            >
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
