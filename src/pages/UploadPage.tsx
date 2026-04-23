import { useState, useCallback, useRef, useEffect } from "react";
import { getSelectedWorkspaceId, recordingsApi } from "@/lib/api";
import { useBlocker, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { Upload, FileVideo, X, Loader2 } from "lucide-react";
import { trackClientEvent } from "@/lib/analyticsClient";
import { getSocket } from "@/lib/socket";
import {
  mergeByPartNumber,
  parseListPartsResponse,
  sortUploadedParts,
  extractPresignedUrlFromPayload,
} from "@/lib/multipartResume";
import { Ad } from "@/components/Ads";

const PART_SIZE = 5 * 1024 * 1024; // 5MB
const VIDEO_DURATION_LIMIT_ERROR = "video duration exceeds current plan limit";

export default function UploadPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirm = useConfirmDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<"select" | "uploading" | "processing" | "done">("select");
  const [dragOver, setDragOver] = useState(false);
  const [activeUploadSession, setActiveUploadSession] = useState<{
    recordingId: number;
    uploadId: string;
  } | null>(null);
  const [processingRecordingId, setProcessingRecordingId] = useState<number | null>(null);
  const [cancellingUpload, setCancellingUpload] = useState(false);
  const cancelRequestedRef = useRef(false);
  const chunkAbortControllerRef = useRef<AbortController | null>(null);
  const processingInitiatedRef = useRef(false);
  const processingFailureDeleteInFlightRef = useRef<Set<number>>(new Set());
  const shouldWarnBeforeLeave = step === "uploading" && !cancelRequestedRef.current;

  const blocker = useBlocker(shouldWarnBeforeLeave);



  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const confirmed = window.confirm(
      "Upload is still in progress. Your changes may not be saved. Are you sure you want to leave this page?",
    );
    if (confirmed) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldWarnBeforeLeave) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [shouldWarnBeforeLeave]);

  useEffect(() => {
    if (step !== "processing" || !processingRecordingId) return;
    const socket = getSocket();
    const getEventRecordingId = (data: any) =>
      Number(data?.recordingId ?? data?.recording_id ?? data?.id ?? data?.recording?.id ?? NaN);

    const onProcessingInitiated = (data: any) => {
      const eventRecordingId = getEventRecordingId(data);
      if (!Number.isFinite(eventRecordingId) || eventRecordingId !== processingRecordingId) return;
      processingInitiatedRef.current = true;
    };

    const onProcessingFailed = (data: any) => {
      const eventRecordingId = getEventRecordingId(data);
      if (!Number.isFinite(eventRecordingId) || eventRecordingId !== processingRecordingId) return;
      if (!processingInitiatedRef.current) return;
      if (processingFailureDeleteInFlightRef.current.has(processingRecordingId)) return;
      processingFailureDeleteInFlightRef.current.add(processingRecordingId);
      void recordingsApi
        .delete(processingRecordingId, undefined, { permanent: true })
        .catch(() => {
          // Ignore cleanup failures from background socket handling.
        })
        .finally(() => {
          processingFailureDeleteInFlightRef.current.delete(processingRecordingId);
        });
    };

    socket.on("processing_initiated", onProcessingInitiated);
    socket.on("processing_failed", onProcessingFailed);
    return () => {
      socket.off("processing_initiated", onProcessingInitiated);
      socket.off("processing_failed", onProcessingFailed);
    };
  }, [step, processingRecordingId]);

  const handleFile = (f: File) => {
    setFile(f);
    setTitle((prev) => prev.trim() || f.name.replace(/\.[^/.]+$/, ""));
    trackClientEvent({
      eventType: "click",
      eventName: "upload_video_selected",
      metadata: { route: "/upload", fileName: f.name, sizeBytes: f.size },
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith("video/")) handleFile(f);
      else toast({ title: "Invalid file", description: "Please drop a video file.", variant: "destructive" });
    },
    [toast],
  );

  const runFileMultipartUpload = async (
    fileArg: File,
    recordingId: number,
    uploadId: string,
    workspaceId: string,
    startingUploaded: { partNumber: number; eTag: string }[],
  ) => {
    const totalParts = Math.ceil(fileArg.size / PART_SIZE);
    const serverListed = parseListPartsResponse(
      await recordingsApi.getUploadedParts(recordingId, uploadId, workspaceId),
    );
    let mergedKnown = mergeByPartNumber(serverListed, startingUploaded);
    const uploadedNums = new Set(mergedKnown.map((p) => p.partNumber));

    const missing: number[] = [];
    for (let i = 1; i <= totalParts; i++) {
      if (!uploadedNums.has(i)) missing.push(i);
    }
    const initialProgress = totalParts > 0 ? Math.round((uploadedNums.size / totalParts) * 100) : 0;
    setProgress(initialProgress);

    for (let idx = 0; idx < missing.length; idx++) {
      if (cancelRequestedRef.current) {
        throw new Error("Upload cancelled by user.");
      }
      const partNum = missing[idx];
      const start = (partNum - 1) * PART_SIZE;
      const end = Math.min(start + PART_SIZE, fileArg.size);
      const chunk = fileArg.slice(start, end);
      const presigned = await recordingsApi.getPresignedUrls(recordingId, uploadId, [partNum], PART_SIZE);
      const url = extractPresignedUrlFromPayload(presigned, partNum);
      const chunkAbortController = new AbortController();
      chunkAbortControllerRef.current = chunkAbortController;
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: chunk,
        headers: { "Content-Type": fileArg.type },
        signal: chunkAbortController.signal,
      });
      chunkAbortControllerRef.current = null;
      if (!uploadRes.ok) {
        throw new Error(`Part ${partNum} upload failed with status ${uploadRes.status}.`);
      }
      const eTag = uploadRes.headers.get("etag");
      if (!eTag) {
        throw new Error(`Missing ETag for part ${partNum}.`);
      }
      const clean = eTag.replace(/"/g, "");
      mergedKnown = mergeByPartNumber(mergedKnown, [{ partNumber: partNum, eTag: clean }]);
      const completedParts = uploadedNums.size + idx + 1;
      setProgress(totalParts > 0 ? Math.round((completedParts / totalParts) * 100) : 0);
    }

    // Ensure users see progress near completion while finalize API is running.
    setProgress((prev) => Math.max(prev, 95));
    if (cancelRequestedRef.current) {
      throw new Error("Upload cancelled by user.");
    }
    const completeRes = await recordingsApi.completeUpload(recordingId, uploadId, {
      data: sortUploadedParts(mergedKnown),
      chunkSize: PART_SIZE,
      workspaceId,
    });
    setProgress(100);

    return completeRes;
  };
useEffect(() => {
  const socket = getSocket();
  socket.on("processing_failed", (data: any) => {
    if (!processingInitiatedRef.current) return;
    if (processingFailureDeleteInFlightRef.current.has(processingRecordingId)) return;
    processingFailureDeleteInFlightRef.current.add(processingRecordingId);
    void recordingsApi.delete(processingRecordingId, undefined, { permanent: true }).catch(() => {
  })
})},[processingRecordingId])

  const handleUpload = async () => {
    const fileToUse = file;
    if (!fileToUse || !title.trim()) {
      toast({ title: "Select a file and title", variant: "destructive" });
      return;
    }

    const workspaceId = getSelectedWorkspaceId();
    if (!workspaceId) {
      toast({ title: "Workspace required", variant: "destructive" });
      return;
    }

    trackClientEvent({
      eventType: "click",
      eventName: "upload_submit",
      metadata: { route: "/upload", title: title.trim() },
    });
    setUploading(true);
    setStep("uploading");
    setProgress(0);
    cancelRequestedRef.current = false;
    setCancellingUpload(false);

    let recordingId: number | undefined;
    try {
      const draft = await recordingsApi.create(title.trim());
      recordingId = Number(draft.id || draft.recording?.id);

      trackClientEvent({
        eventType: "recording_created",
        eventName: "recording_draft_created",
        metadata: { recordingId, route: "/upload" },
      });

      const upload = await recordingsApi.initUpload(recordingId, {
        fileName: fileToUse.name,
        contentType: fileToUse.type,
      });
      const uploadId = upload.uploadId;
      setActiveUploadSession({
        recordingId,
        uploadId,
      });

      const completeRes = await runFileMultipartUpload(
        fileToUse,
        recordingId,
        uploadId,
        workspaceId,
        [],
      );

      setStep("processing");
      setProcessingRecordingId(recordingId);
      // Upload finalize means backend processing has started for this recording,
      // even if the realtime "processing_initiated" event arrives earlier/later.
      processingInitiatedRef.current = true;
      toastApiSuccess(completeRes, {
        title: "Upload complete",
        fallbackDescription: "Your video is now being processed.",
      });

      trackClientEvent({
        eventType: "recording_completed",
        eventName: "recording_upload_finalized",
        metadata: { recordingId, route: "/upload" },
      });

      setTimeout(() => navigate(`/recording/${recordingId}`), 2000);
    } catch (err: any) {
      const errorMessage =
        typeof err?.message === "string" ? err.message.toLowerCase() : "";
      if (
        recordingId &&
        errorMessage.includes(VIDEO_DURATION_LIMIT_ERROR)
      ) {
        try {
          await recordingsApi.delete(recordingId, undefined, {
            permanent: true,
          });
        } catch {
          // Keep the original failure visible even if cleanup fails.
        }
      }
      if (cancelRequestedRef.current) {
        toast({ title: "Upload cancelled", variant: "success" });
        setStep("select");
        setProcessingRecordingId(null);
        processingInitiatedRef.current = false;
        setFile(null);
        setTitle("");
        return;
      }
      toast({
        title: "Upload failed",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
      setStep("select");
      setProcessingRecordingId(null);
      processingInitiatedRef.current = false;
    } finally {
      cancelRequestedRef.current = false;
      chunkAbortControllerRef.current = null;
      setActiveUploadSession(null);
      setCancellingUpload(false);
      setUploading(false);
    }
  };

  const handleCancelActiveUpload = async () => {
    if (!activeUploadSession || cancellingUpload) return;
    const confirmed = await confirm({
      title: "Cancel this upload?",
      description:
        "This will stop the current upload, abort multipart upload on the server, and delete this recording draft.",
      confirmText: "Cancel upload",
      cancelText: "Keep uploading",
    });
    if (!confirmed) return;

    setCancellingUpload(true);
    cancelRequestedRef.current = true;
    chunkAbortControllerRef.current?.abort();
    try {
      await recordingsApi.abortUpload(activeUploadSession.recordingId, activeUploadSession.uploadId);
    } catch {
      try {
        await recordingsApi.abortMultipartUpload(activeUploadSession.recordingId);
      } catch {
        // ignore abort failures and still attempt deletion
      }
    }
    try {
      await recordingsApi.delete(activeUploadSession.recordingId, undefined, {
        permanent: true,
      });
    } catch {
      // ignore delete failures, backend may already clean this up
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Upload Recording</h1>
        <p className="text-muted-foreground mb-8">Upload your video directly to cloud storage.</p>

        <Card className="glass">
          <CardContent className="p-6">
            {step === "select" && (
              <div className="space-y-6">
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <FileVideo className="h-12 w-12 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setTitle("");
                        }}
                      >
                        <X className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="gradient-primary rounded-2xl p-4">
                        <Upload className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Drop your video here</p>
                        <p className="text-sm text-muted-foreground">or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>

                {file && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recording title" />
                    </div>
                    <Button className="w-full gradient-primary" onClick={() => void handleUpload()} disabled={!title.trim()}>
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === "uploading" && (
              <div className="text-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <h3 className="text-lg font-semibold">Uploading...</h3>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{progress}% complete</p>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-white"
                  onClick={() => void handleCancelActiveUpload()}
                  disabled={!activeUploadSession || cancellingUpload}
                >
                  {cancellingUpload ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Cancel upload
                </Button>
              </div>
            )}

            {step === "processing" && (
              <div className="text-center py-8 space-y-4">
                <div className="gradient-primary rounded-full p-4 w-fit mx-auto animate-pulse-slow">
                  <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
                </div>
                <h3 className="text-lg font-semibold">Processing video...</h3>
                <p className="text-sm text-muted-foreground">This may take a few moments. You'll be redirected shortly.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* <!-- upload_bottom --> */}
        <Ad/>
    </AppLayout>
  );
}
