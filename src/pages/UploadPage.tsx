import { useState, useCallback, useRef, useEffect } from "react";
import { getSelectedWorkspaceId, recordingsApi } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { Upload, FileVideo, X, Loader2, RefreshCw } from "lucide-react";
import { trackClientEvent } from "@/lib/analyticsClient";
import {
  mergeByPartNumber,
  parseListPartsResponse,
  sortUploadedParts,
  extractPresignedUrlFromPayload,
} from "@/lib/multipartResume";

const PART_SIZE = 5 * 1024 * 1024; // 5MB

async function fetchUploadingRecordingContext(recordingId: number): Promise<{
  recordingId: number;
  uploadId: string;
  title: string;
  expectedSizeBytes?: number;
} | null> {
  const listRes = await recordingsApi.myRecordings({
    limit: 200,
    page: 1,
    filters: { unfinishedMultipart: true },
  });
  const recordings =
    (listRes as { recordings?: unknown[] }).recordings ??
    (listRes as { data?: unknown[] }).data ??
    [];
  const rec = recordings.find((r: { id?: unknown }) => Number(r.id) === recordingId) as
    | { multipartUploadId?: string; title?: unknown; size?: unknown }
    | undefined;
  if (!rec?.multipartUploadId) return null;
  const sz = rec.size;
  return {
    recordingId,
    uploadId: rec.multipartUploadId,
    title: typeof rec.title === "string" ? rec.title : "",
    expectedSizeBytes: typeof sz === "number" && sz > 0 ? sz : undefined,
  };
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<"select" | "uploading" | "processing" | "done">("select");
  const [dragOver, setDragOver] = useState(false);
  const [uploadingDrafts, setUploadingDrafts] = useState<{ id: number; title?: string }[]>(
    [],
  );
  const [resumeHintId, setResumeHintId] = useState<number | null>(null);

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

  useEffect(() => {
    void refreshUploadingDrafts();
  }, [step, uploading, refreshUploadingDrafts]);

  useEffect(() => {
    const raw = searchParams.get("resumeRecordingId");
    if (!raw) {
      setResumeHintId(null);
      return;
    }
    const id = Number(raw);
    if (!Number.isFinite(id)) return;
    setResumeHintId(id);
    void (async () => {
      const ctx = await fetchUploadingRecordingContext(id);
      if (ctx?.title) setTitle(ctx.title);
      toast({
        title: "Resume upload",
        description: ctx?.title
          ? `Select the same video file for «${ctx.title}». Already-uploaded parts will be reused.`
          : `Select the same video file as before. Recording #${id}.`,
      });
    })();
  }, [searchParams, toast]);

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

  const discardFileCheckpoint = async (recordingId: number) => {
    try {
      await recordingsApi.abortMultipartUpload(recordingId);
    } catch {
      /* ignore */
    }
    void refreshUploadingDrafts();
    toast({ title: "Incomplete upload discarded" });
  };

  const runFileMultipartUpload = async (
    fileArg: File,
    titleArg: string,
    recordingId: number,
    uploadId: string,
    workspaceId: string,
    startingUploaded: { partNumber: number; eTag: string }[],
  ) => {
    const totalParts = Math.ceil(fileArg.size / PART_SIZE);
    const serverListed = parseListPartsResponse(await recordingsApi.getUploadedParts(recordingId, uploadId));
    let mergedKnown = mergeByPartNumber(serverListed, startingUploaded);
    const uploadedNums = new Set(mergedKnown.map((p) => p.partNumber));

    const missing: number[] = [];
    for (let i = 1; i <= totalParts; i++) {
      if (!uploadedNums.has(i)) missing.push(i);
    }

    for (let idx = 0; idx < missing.length; idx++) {
      const partNum = missing[idx];
      const start = (partNum - 1) * PART_SIZE;
      const end = Math.min(start + PART_SIZE, fileArg.size);
      const chunk = fileArg.slice(start, end);
      const presigned = await recordingsApi.getPresignedUrls(recordingId, uploadId, [partNum], PART_SIZE);
      const url = extractPresignedUrlFromPayload(presigned, partNum);
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: chunk,
        headers: { "Content-Type": fileArg.type },
      });
      if (!uploadRes.ok) {
        throw new Error(`Part ${partNum} upload failed with status ${uploadRes.status}.`);
      }
      const eTag = uploadRes.headers.get("etag");
      if (!eTag) {
        throw new Error(`Missing ETag for part ${partNum}.`);
      }
      const clean = eTag.replace(/"/g, "");
      mergedKnown = mergeByPartNumber(mergedKnown, [{ partNumber: partNum, eTag: clean }]);
      setProgress(Math.round(((idx + 1) / missing.length) * 100));
    }

    const completeRes = await recordingsApi.completeUpload(recordingId, uploadId, {
      data: sortUploadedParts(mergedKnown),
      chunkSize: PART_SIZE,
      workspaceId,
    });

    return completeRes;
  };

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

    let resumeCtx: Awaited<ReturnType<typeof fetchUploadingRecordingContext>> | null = null;
    if (resumeHintId != null) {
      resumeCtx = await fetchUploadingRecordingContext(resumeHintId);
      if (!resumeCtx) {
        toast({
          title: "Nothing to resume",
          description: "That recording is no longer in uploading state.",
          variant: "destructive",
        });
        return;
      }
      if (
        resumeCtx.expectedSizeBytes !== undefined &&
        resumeCtx.expectedSizeBytes > 0 &&
        fileToUse.size !== resumeCtx.expectedSizeBytes
      ) {
        toast({
          title: "Wrong file size",
          description:
            `This recording expects ${resumeCtx.expectedSizeBytes} bytes. Pick the exact same file you uploaded before.`,
          variant: "destructive",
        });
        return;
      }
    }

    trackClientEvent({
      eventType: "click",
      eventName: resumeCtx ? "upload_resume" : "upload_submit",
      metadata: { route: "/upload", title: title.trim(), resume: Boolean(resumeCtx) },
    });
    setUploading(true);
    setStep("uploading");
    setProgress(0);

    let recordingId: number | undefined;
    try {
      if (resumeCtx) {
        recordingId = resumeCtx.recordingId;
        const completeRes = await runFileMultipartUpload(
          fileToUse,
          resumeCtx.title || title.trim(),
          resumeCtx.recordingId,
          resumeCtx.uploadId,
          workspaceId,
          [],
        );
        setStep("processing");
        toastApiSuccess(completeRes, {
          title: "Upload complete",
          fallbackDescription: "Your video is now being processed.",
        });
        setSearchParams({});
        setTimeout(() => navigate(`/recording/${recordingId}`), 2000);
        return;
      }

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

      const completeRes = await runFileMultipartUpload(
        fileToUse,
        title.trim(),
        recordingId,
        uploadId,
        workspaceId,
        [],
      );

      setStep("processing");
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
      toast({
        title: resumeCtx ? "Resume failed" : "Upload failed",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
      setStep("select");
    } finally {
      setUploading(false);
    }
  };

  const resumeFromList = (draft: { id: number; title?: string }) => {
    setResumeHintId(draft.id);
    setTitle(draft.title ?? "");
    setSearchParams({ resumeRecordingId: String(draft.id) });
    setStep("select");
    toast({
      title: "Select your file",
      description: `Choose the same video file as before for recording #${draft.id}.`,
    });
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Upload Recording</h1>
        <p className="text-muted-foreground mb-8">
          Parts upload straight to cloud storage; resume retries missing parts using what is already stored.
        </p>

        {uploadingDrafts.length > 0 && (
          <Card className="glass border-amber-500/30 mb-6">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Uploads in progress (finish from any device)
              </p>
              <ul className="space-y-2">
                {uploadingDrafts.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm border border-border rounded-lg px-3 py-2"
                  >
                    <span className="truncate">
                      {m.title ?? `Recording #${m.id}`}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => resumeFromList(m)}>
                        Resume file
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void discardFileCheckpoint(m.id)}>
                        Discard
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="glass">
          <CardContent className="p-6">
            {step === "select" && (
              <div className="space-y-6">
                {resumeHintId && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                    Resuming recording #{resumeHintId}. Select the <strong>same</strong> video file (same bytes as before), then click Upload.
                  </p>
                )}
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
                      <Upload className="h-4 w-4 mr-2" /> {resumeHintId ? "Resume upload" : "Upload"}
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
    </AppLayout>
  );
}
