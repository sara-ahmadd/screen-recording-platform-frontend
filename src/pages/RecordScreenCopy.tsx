import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSelectedWorkspaceId, recordingsApi } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import {
  ArrowUpDown,
  Clock,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  Pause,
  Play,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackClientEvent } from "@/lib/analyticsClient";

type RecordingState = "idle" | "recording" | "paused" | "stopping" | "processing";

type MainSource = "screen" | "camera";
type UploadedPart = { partNumber: number; eTag: string };

const CHUNK_TIMESLICE_MS = 1000;
const TARGET_UPLOAD_CHUNK_SIZE = 2 * 1024 * 1024;

export default function RecordScreenCopy() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [state, setState] = useState<RecordingState>("idle");
  const [title, setTitle] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [mainSource, setMainSource] = useState<MainSource>("screen");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [workspaceAlertOpen, setWorkspaceAlertOpen] = useState(false);
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null);
  const [systemAudioDetected, setSystemAudioDetected] = useState<boolean | null>(null);
  const mainSourceRef = useRef<MainSource>("screen");
  const cameraEnabledRef = useRef(false);

  const screenPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const screenSourceVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraSourceVideoRef = useRef<HTMLVideoElement | null>(null);

  const displayStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
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

  const formattedTime = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [elapsed]);

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
    screenSourceVideoRef.current = null;
    cameraSourceVideoRef.current = null;
    setSelectedSurface(null);
    setSystemAudioDetected(null);
  };

  const updateMicTrackEnabled = (enabled: boolean) => {
    micStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  };

  const getPresignedUrlForPart = async (recordingId: number, uploadId: string, partNumber: number, chunkSize: number) => {
    const res = await recordingsApi.getPresignedUrls(recordingId, uploadId, [partNumber], chunkSize);
    const directResultUrl = res?.result?.[0]?.url;
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
    const url = extractUrl(res);
    if (url) return url;
    throw new Error("Could not get presigned URL for upload part.");
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
          const partNumber = session.nextPart++;
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

  const finalizeUpload = useCallback(
    async (recordingId: number, uploadId: string, uploadedParts: UploadedPart[]) => {
      const completeRes = await recordingsApi.completeUpload(recordingId, uploadId, {
        data: uploadedParts,
        chunkSize: TARGET_UPLOAD_CHUNK_SIZE,
      });
      setState("processing");
      toastApiSuccess(completeRes, {
        title: "Upload complete",
        fallbackDescription: "Your recording is being processed.",
      });
      trackClientEvent({
        eventType: "recording_completed",
        eventName: "recording_upload_finalized",
        metadata: { recordingId, route: "/record-copy" },
      });
      stopAllStreams();
      setTimeout(() => navigate(`/recording/${recordingId}`), 1200);
    },
    [navigate],
  );

  const startRecording = async () => {
    if (preparing) return;
    setPreparing(true);
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
      const safeTitle = title.trim() || `Recording ${new Date().toLocaleString()}`;
      setTitle(safeTitle);

      const draft = await recordingsApi.create(safeTitle);
      const recordingId = Number(draft?.recording?.id ?? draft?.id ?? draft?.data?.id);
      if (Number.isNaN(recordingId)) {
        throw new Error("Unable to create recording draft: missing id in response.");
      }

      trackClientEvent({
        eventType: "recording_created",
        eventName: "recording_draft_created",
        metadata: { recordingId, route: "/record-copy" },
      });

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      displayStreamRef.current = displayStream;


      const displayTrack = displayStream.getVideoTracks()[0];
      const displaySurface = (displayTrack?.getSettings() as any)?.displaySurface as
        | "monitor"
        | "window"
        | "browser"
        | undefined;
      setSelectedSurface(displaySurface ?? "unknown");
      const displayAudioTracks = displayStream.getAudioTracks();
      setSystemAudioDetected(displayAudioTracks.length > 0);
      if (displayAudioTracks.length === 0) {
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
      const combinedAudioTracks: MediaStreamTrack[] = [];
      displayAudioTracks.forEach((track) => {
        track.enabled = true;
        combinedAudioTracks.push(track);
      });
      if (micStream) {
        micStream.getAudioTracks().forEach((track) => {
          track.enabled = micEnabled;
          combinedAudioTracks.push(track);
        });
      }

      const mixed = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...combinedAudioTracks,
      ]);
      if (mixed.getVideoTracks().length === 0) {
        throw new Error("No video track available in recording stream.");
      }
      mixedStreamRef.current = mixed;

      const init = await recordingsApi.initUpload(recordingId, {
        fileName: `${safeTitle}.${recordingExtension}`,
        contentType: recordingMimeType,
      });
      if (!init?.uploadId) throw new Error("Unable to initialize upload session.");
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
          videoBitsPerSecond: 4_000_000,
          audioBitsPerSecond: 128_000,
        });
      } catch {
        recorder = new MediaRecorder(mixed);
      }
      recorderRef.current = recorder;
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
      uploadSessionRef.current = null;
      setState("idle");
    } finally {
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
    if (!session || !recorder) {
      setState("idle");
      stopAllStreams();
      return;
    }
    try {
      await new Promise<void>((resolve) => {
        const onStop = () => resolve();
        recorder.addEventListener("stop", onStop, { once: true });
        recorder.stop();
      });
      session.doneCollecting = true;
      flushBufferedChunkToQueue(recordingMimeType, true);
      await processUploadQueue(recordingMimeType);
      await waitForUploadDrain();
      if (session.uploadedParts.length === 0) {
        throw new Error("No media data was captured.");
      }
      await finalizeUpload(session.recordingId, session.uploadId, session.uploadedParts);
    } catch (err: any) {
      toast({
        title: "Failed to finalize upload",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setState("idle");
      stopAllStreams();
    } finally {
      recorderRef.current = null;
      uploadSessionRef.current = null;
    }
  };

  const pauseRecording = () => {
    if (state !== "recording" || !recorderRef.current) return;
    const rec = recorderRef.current;
    try {
      if (rec.state === "recording") {
        rec.pause();
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
    if (state !== "paused" || !recorderRef.current) return;
    const rec = recorderRef.current;
    try {
      if (rec.state === "paused") {
        rec.resume();
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

  const toggleCameraLive = async () => {
    if (state === "idle") {
      setCameraEnabled((prev) => {
        cameraEnabledRef.current = !prev;
        return !prev;
      });
      return;
    }
    if (!cameraEnabled) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStreamRef.current = camStream;
        if (cameraSourceVideoRef.current) {
          cameraSourceVideoRef.current.srcObject = camStream;
          cameraSourceVideoRef.current.muted = true;
          void cameraSourceVideoRef.current.play().catch(() => {});
        }
        if (cameraPreviewRef.current) {
          cameraPreviewRef.current.srcObject = camStream;
          void cameraPreviewRef.current.play().catch(() => {});
        }
        setCameraEnabled(true);
        cameraEnabledRef.current = true;
      } catch {
        toast({ title: "Camera unavailable", description: "Could not turn camera on." });
      }
      return;
    }
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    if (cameraSourceVideoRef.current) cameraSourceVideoRef.current.srcObject = null;
    if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = null;
    setCameraEnabled(false);
    cameraEnabledRef.current = false;
    if (mainSource === "camera") setMainSource("screen");
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAllStreams();
    };
  }, []);

  useEffect(() => {
    mainSourceRef.current = mainSource;
  }, [mainSource]);

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

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Record Screen</h1>
          <p className="text-muted-foreground">
            1080p screen recording with webcam/mic controls and robust upload.
          </p>
        </div>

        {state === "idle" && (
          <Card className="glass border-primary/20">
            <CardContent className="p-5 space-y-2">
              <p className="text-sm font-semibold">Pre-record checklist</p>
              <p className="text-sm text-muted-foreground">
                Browser: {browserName}. You can share an entire screen, a window, or a browser tab.
              </p>
              <div className="text-sm space-y-1">
                <p>• Capture support: {supportsCapture ? "Ready" : "Not supported in this browser"}</p>
                <p>• Output quality: 1080p (1920x1080)</p>
                <p>• Audio: microphone + shared screen/tab audio (if provided by browser/OS)</p>
                <p>• Tip: to capture website audio, share the browser tab and enable audio in the share dialog</p>
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
              </div>
            )}
            {state !== "idle" && (
              <div className={cn("grid gap-4", cameraEnabled ? "md:grid-cols-2" : "md:grid-cols-1")}>
                <div className="space-y-2">
                  <Label>{mainSource === "screen" ? "Main preview (Screen)" : "Secondary preview (Screen)"}</Label>
                  <video
                    ref={screenPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-xl bg-black aspect-video"
                  />
                </div>
                {cameraEnabled && (
                  <div className="space-y-2">
                    <Label>{mainSource === "camera" ? "Main preview (Camera)" : "Secondary preview (Camera)"}</Label>
                    <video
                      ref={cameraPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full rounded-xl bg-black aspect-video"
                    />
                  </div>
                )}
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
              <Button
                type="button"
                variant={cameraEnabled ? "default" : "outline"}
                className={cn(cameraEnabled ? "gradient-primary" : "")}
                onClick={() => void toggleCameraLive()}
              >
                {cameraEnabled ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />}
                {cameraEnabled ? "Camera On" : "Camera Off"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMainSource((prev) => (prev === "screen" ? "camera" : "screen"))}
                disabled={!cameraEnabled || (state !== "recording" && state !== "paused")}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" /> Swap Main
              </Button>
              <div className="rounded-md border border-border px-3 py-2 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-mono">{formattedTime}</span>
              </div>
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
                      eventName: "record_start_recording",
                      metadata: { route: "/record-copy" },
                    });
                    void startRecording();
                  }}
                  disabled={preparing}
                >
                  {preparing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Monitor className="h-4 w-4 mr-2" />}
                  Start Recording
                </Button>
              )}
              {state === "recording" && (
                <>
                  <Button variant="outline" onClick={pauseRecording}>
                    <Pause className="h-4 w-4 mr-2" /> Pause
                  </Button>
                  <Button variant="destructive" onClick={() => void stopRecording()}>
                    <Square className="h-4 w-4 mr-2" /> Stop & Finalize
                  </Button>
                </>
              )}
              {state === "paused" && (
                <>
                  <Button variant="outline" onClick={resumeRecording}>
                    <Play className="h-4 w-4 mr-2" /> Resume
                  </Button>
                  <Button variant="destructive" onClick={() => void stopRecording()}>
                    <Square className="h-4 w-4 mr-2" /> Stop & Finalize
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </AppLayout>
  );
}

/**
 * import React, { useRef, useState } from "react";

const RecordScreenCopy: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startRecording = async () => {
    let screenStream: MediaStream | null = null;
    let audioStream: MediaStream | null = null;
    let cameraStream: MediaStream | null = null;

    try {
      setErrorMessage("");
      setRecordedChunks([]);

      // Screen capture is required.
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio:{
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      try {
        // Mic is optional; continue if denied.
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        console.warn("Microphone permission denied. Continuing without microphone.");
      }

      try {
        // Camera is optional; continue if denied.
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch {
        console.warn("Camera permission denied. Continuing without camera.");
      }

      const combinedStream = new MediaStream([
        ...screenStream.getTracks(),
        ...(audioStream?.getTracks() ?? []),
        ...(cameraStream?.getTracks() ?? []),
      ]);

      if (videoRef.current) {
        videoRef.current.srcObject = combinedStream;
        void videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      const stopTracks = () => {
        combinedStream.getTracks().forEach((track) => track.stop());
        screenStream?.getTracks().forEach((track) => track.stop());
        audioStream?.getTracks().forEach((track) => track.stop());
        cameraStream?.getTracks().forEach((track) => track.stop());
      };

      screenStream.getTracks().forEach((track) => {
        track.onended = stopTracks;
      });
    } catch (error) {
      screenStream?.getTracks().forEach((track) => track.stop());
      audioStream?.getTracks().forEach((track) => track.stop());
      cameraStream?.getTracks().forEach((track) => track.stop());
      setErrorMessage("Screen permission was denied. Please allow screen sharing and try again.");
      console.error("Error starting screen recording:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const downloadRecording = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "screen-recording-with-audio.webm";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container w-[700px] h-[700px]">
      <div className="screen-recorder">
        {errorMessage && <p className="mb-3 text-sm text-red-500">{errorMessage}</p>}
        {isRecording && <div className="h-1 w-full bg-red-500 animate-pulse"></div>}
        {isRecording && <video ref={videoRef} className="border w-full mb-4" autoPlay muted />}
        <div className="flex space-x-2">
          {!isRecording ? (
            <button onClick={startRecording} className="px-4 py-2 bg-blue-500 text-white rounded">
              Start Recording
            </button>
          ) : (
            <button onClick={stopRecording} className="px-4 py-2 bg-red-500 text-white rounded">
              Stop Recording
            </button>
          )}
          {recordedChunks.length > 0 && (
            <button onClick={downloadRecording} className="px-4 py-2 bg-green-500 text-white rounded">
              Download Recording
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordScreenCopy;
 */