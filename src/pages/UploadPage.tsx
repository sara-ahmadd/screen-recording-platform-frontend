import { useState, useCallback, useRef } from "react";
import { getSelectedWorkspaceId, recordingsApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { Upload, FileVideo, X, Loader2, Check } from "lucide-react";
import { trackClientEvent } from "@/lib/analyticsClient";

const PART_SIZE = 5 * 1024 * 1024; // 5MB

export default function UploadPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<"select" | "uploading" | "processing" | "done">("select");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    setFile(f);
    setTitle(f.name.replace(/\.[^/.]+$/, ""));
    trackClientEvent({
      eventType: "click",
      eventName: "upload_video_selected",
      metadata: { route: "/upload", fileName: f.name, sizeBytes: f.size },
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) handleFile(f);
    else toast({ title: "Invalid file", description: "Please drop a video file.", variant: "destructive" });
  }, [toast]);

  const handleUpload = async () => {
    if (!file || !title) return;
    trackClientEvent({
      eventType: "click",
      eventName: "upload_submit",
      metadata: { route: "/upload", title: title.trim(), fileName: file.name },
    });
    setUploading(true);
    setStep("uploading");
    setProgress(0);

    try {
      const workspaceId = getSelectedWorkspaceId();
      if (!workspaceId) throw new Error("Workspace is required.");

      // 1. Create draft
      const draft = await recordingsApi.create(title);
      const recordingId = draft.id || draft.recording?.id;

      trackClientEvent({
        eventType: "recording_created",
        eventName: "recording_draft_created",
        metadata: { recordingId, route: "/upload" },
      });

      // 2. Init upload
      const upload = await recordingsApi.initUpload(recordingId, {
        fileName: file.name,
        contentType: file.type,
      });
      const uploadId = upload.uploadId;

      // 3. Calculate parts
      const totalParts = Math.ceil(file.size / PART_SIZE);
      const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

      // 4. Get presigned URLs
      const presigned = await recordingsApi.getPresignedUrls(
        recordingId,
        uploadId,
        partNumbers,
        PART_SIZE,
      );
      const urls =
        presigned?.result ||
        presigned?.urls ||
        presigned?.presignedUrls ||
        presigned;

      // 5. Upload parts
      const etags: { partNumber: number; eTag: string }[] = [];
      for (let i = 0; i < totalParts; i++) {
        const start = i * PART_SIZE;
        const end = Math.min(start + PART_SIZE, file.size);
        const chunk = file.slice(start, end);
        const url = Array.isArray(urls) ? urls[i]?.url || urls[i] : urls[String(i + 1)];

        const uploadRes = await fetch(url, {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": file.type },
        });
        if (!uploadRes.ok) {
          throw new Error(`Part ${i + 1} upload failed with status ${uploadRes.status}.`);
        }

        const eTag = uploadRes.headers.get("etag");
        if (!eTag) {
          throw new Error(`Missing ETag for part ${i + 1}.`);
        }
        etags.push({ partNumber: i + 1, eTag });
        setProgress(Math.round(((i + 1) / totalParts) * 100));
      }

      // 6. Complete upload
      const completeRes = await recordingsApi.completeUpload(recordingId, uploadId, {
        data: etags,
        chunkSize: PART_SIZE,
        workspaceId,
      });

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

      // Navigate to recording
      setTimeout(() => navigate(`/recording/${recordingId}`), 2000);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setStep("select");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Upload Recording</h1>
        <p className="text-muted-foreground mb-8">Upload a video file to get started</p>

        <Card className="glass">
          <CardContent className="p-6">
            {step === "select" && (
              <div className="space-y-6">
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(""); }}>
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
                    <Button className="w-full gradient-primary" onClick={handleUpload} disabled={!title}>
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
