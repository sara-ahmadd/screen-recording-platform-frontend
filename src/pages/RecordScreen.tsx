import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReactMediaRecorder } from "react-media-recorder";
import { getSelectedWorkspaceId, recordingsApi } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import {
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

type RecordingState = "idle" | "recording" | "paused" | "stopping" | "processing";
type UploadSession = {
  recordingId: number;
  uploadId: string;
  title: string;
};

function getDefaultTitle() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "-");
  return `Rec-${date}-${time}`;
}

export default function RecordScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [state, setState] = useState<RecordingState>("idle");
  const [title, setTitle] = useState(getDefaultTitle);
  const [elapsed, setElapsed] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [workspaceAlertOpen, setWorkspaceAlertOpen] = useState(false);
  const [showPreviews, setShowPreviews] = useState(false);
  const [cameraPreviewError, setCameraPreviewError] = useState<string | null>(null);
  const [mainPreview, setMainPreview] = useState<"screen" | "camera">("screen");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const screenPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraPreviewStreamRef = useRef<MediaStream | null>(null);
  const uploadSessionRef = useRef<UploadSession | null>(null);

  const formattedTime = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [elapsed]);

  const startTimer = () => {
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (cameraPreviewStreamRef.current) {
        cameraPreviewStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraPreviewStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const shouldShowCameraPreview =
      showPreviews && cameraEnabled && state !== "idle" && state !== "processing";

    if (!shouldShowCameraPreview) {
      setCameraPreviewError(null);
      if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = null;
      if (cameraPreviewStreamRef.current) {
        cameraPreviewStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraPreviewStreamRef.current = null;
      }
      return;
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cameraPreviewStreamRef.current) {
          cameraPreviewStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        cameraPreviewStreamRef.current = stream;
        if (cameraPreviewRef.current) {
          cameraPreviewRef.current.srcObject = stream;
        }
        setCameraPreviewError(null);
      } catch {
        setCameraPreviewError("Camera preview is unavailable. Please allow camera access.");
      }
    })();
  }, [cameraEnabled, showPreviews, state]);

  useEffect(() => {
    if (!cameraEnabled && mainPreview === "camera") {
      setMainPreview("screen");
    }
  }, [cameraEnabled, mainPreview]);

  return (
    <ReactMediaRecorder
      screen
      video={cameraEnabled}
      audio={micEnabled}
      blobPropertyBag={{
        type: "video/webm",
      }}
      mediaRecorderOptions={{
        mimeType: "video/webm",
      }}
      render={({
        status,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        mediaBlobUrl,
        previewStream,
      }) => {
        const handleStart = async () => {
          const workspaceId = getSelectedWorkspaceId();
          if (!workspaceId) {
            setWorkspaceAlertOpen(true);
            return;
          }

          const safeTitle = title.trim() || getDefaultTitle();
          setTitle(safeTitle);
          setShowPreviews(true);

          toast({
            title: "Important",
            description: "Select 'Entire Screen' for full recording.",
          });

          try {
            const draft = await recordingsApi.create(safeTitle);
            const recordingId = Number(draft?.recording?.id ?? draft?.id);
            if (!recordingId) throw new Error("Failed to create recording draft.");

            const init = await recordingsApi.initUpload(recordingId, {
              fileName: `${safeTitle}.webm`,
              contentType: "video/webm",
            });

            if (!init?.uploadId) throw new Error("Failed to initialize upload session.");

            uploadSessionRef.current = {
              recordingId,
              uploadId: init.uploadId,
              title: safeTitle,
            };

            startRecording();
            setState("recording");
            startTimer();
          } catch (err: any) {
            toast({
              title: "Failed to start recording",
              description: err?.message || "Please allow screen/camera/microphone permissions.",
              variant: "destructive",
            });
            setShowPreviews(false);
            setState("idle");
            uploadSessionRef.current = null;
          }
        };

        const handleStop = async () => {
          setState("stopping");
          stopTimer();
          stopRecording();
        };

        useEffect(() => {
          if (status === "stopped" && mediaBlobUrl) {
            (async () => {
              try {
                setState("processing");

                const session = uploadSessionRef.current;
                if (!session) {
                  throw new Error("Upload session not found. Please start recording again.");
                }
                const workspaceId = getSelectedWorkspaceId();
                if (!workspaceId) throw new Error("Workspace is required.");

                const blob = await fetch(mediaBlobUrl).then((r) => r.blob());
                const uploadUrl = await recordingsApi.getPresignedUrls(
                  session.recordingId,
                  session.uploadId,
                  [1],
                  blob.size
                );

                const url = uploadUrl?.result?.[0]?.url;
                if (!url) throw new Error("Missing presigned upload URL.");

                const uploadRes = await fetch(url, {
                  method: "PUT",
                  body: blob,
                  headers: { "Content-Type": "video/webm" },
                });
                if (!uploadRes.ok) {
                  throw new Error(`Part upload failed with status ${uploadRes.status}.`);
                }
                const uploadedETag = uploadRes.headers.get("etag");
                if (!uploadedETag) {
                  throw new Error("Upload completed but no ETag was returned.");
                }

                await recordingsApi.completeUpload(session.recordingId, session.uploadId, {
                  data: [{ partNumber: 1, eTag: uploadedETag }],
                  chunkSize: blob.size,
                  workspaceId,
                });

                toastApiSuccess(null, {
                  title: "Upload complete",
                });

                setTitle(getDefaultTitle());
                uploadSessionRef.current = null;
                setShowPreviews(false);
                setState("idle");
                setTimeout(() => navigate(`/recording/${session.recordingId}`), 1000);
              } catch (err: any) {
                toast({
                  title: "Upload failed",
                  description: err?.message,
                  variant: "destructive",
                });
                setState("idle");
                setShowPreviews(false);
                setTitle(getDefaultTitle());
                uploadSessionRef.current = null;
              }
            })();
          }
        }, [status, mediaBlobUrl, navigate, toast]);

        useEffect(() => {
          if (screenPreviewRef.current) {
            screenPreviewRef.current.srcObject = previewStream ?? null;
          }
        }, [previewStream]);

        return (
          <AppLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Record Screen</h1>
                  <p className="text-muted-foreground mt-1">
                    Capture your screen with optional camera and microphone.
                  </p>
                </div>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="py-3 px-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Recording time: {formattedTime}</span>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recording Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="recording-title">Recording title</Label>
                    <Input
                      id="recording-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={state !== "idle"}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Button
                      type="button"
                      variant={micEnabled ? "default" : "outline"}
                      className={micEnabled ? "gradient-primary" : ""}
                      onClick={() => setMicEnabled((p) => !p)}
                      disabled={state === "stopping" || state === "processing"}
                    >
                      {micEnabled ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
                      {micEnabled ? "Turn microphone off" : "Turn microphone on"}
                    </Button>

                    <Button
                      type="button"
                      variant={cameraEnabled ? "default" : "secondary"}
                      className={cameraEnabled ? "gradient-primary" : ""}
                      onClick={() => setCameraEnabled((p) => !p)}
                      disabled={state === "stopping" || state === "processing"}
                    >
                      {cameraEnabled ? <Video className="mr-2 h-4 w-4" /> : <VideoOff className="mr-2 h-4 w-4" />}
                      {cameraEnabled ? "Turn camera off" : "Turn camera on"}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {state === "idle" && (
                      <Button className="gradient-primary" onClick={handleStart}>
                        <Monitor className="mr-2 h-4 w-4" /> Start recording
                      </Button>
                    )}

                    {state === "recording" && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            pauseRecording();
                            setState("paused");
                          }}
                        >
                          <Pause className="mr-2 h-4 w-4" /> Pause recording
                        </Button>
                        <Button variant="destructive" onClick={handleStop}>
                          <Square className="mr-2 h-4 w-4" /> Stop recording
                        </Button>
                      </>
                    )}

                    {state === "paused" && (
                      <>
                        <Button
                          className="gradient-primary"
                          onClick={() => {
                            resumeRecording();
                            setState("recording");
                          }}
                        >
                          <Play className="mr-2 h-4 w-4" /> Resume recording
                        </Button>
                        <Button variant="destructive" onClick={handleStop}>
                          <Square className="mr-2 h-4 w-4" /> Stop recording
                        </Button>
                      </>
                    )}

                    {(state === "stopping" || state === "processing") && (
                      <Button disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {state === "stopping" ? "Stopping..." : "Processing upload..."}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {showPreviews && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {mainPreview === "screen" ? "Main preview (Screen)" : "Secondary preview (Screen)"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`aspect-video rounded-xl bg-black/90 overflow-hidden border ${
                          mainPreview === "screen" ? "ring-2 ring-primary/60" : ""
                        }`}
                      >
                        <video ref={screenPreviewRef} autoPlay muted className="h-full w-full object-cover" />
                      </div>
                    </CardContent>
                  </Card>

                  {cameraEnabled && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {mainPreview === "camera" ? "Main preview (Camera)" : "Secondary preview (Camera)"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`aspect-video rounded-xl bg-black/90 overflow-hidden border ${
                            mainPreview === "camera" ? "ring-2 ring-primary/60" : ""
                          }`}
                        >
                          <video ref={cameraPreviewRef} autoPlay muted className="h-full w-full object-cover" />
                        </div>
                        {cameraPreviewError && (
                          <p className="text-sm text-destructive mt-3">{cameraPreviewError}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {cameraEnabled && (
                    <div className="lg:col-span-2 flex justify-center">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setMainPreview((prev) => (prev === "screen" ? "camera" : "screen"))
                        }
                      >
                        Swap main preview ({mainPreview === "screen" ? "Screen -> Camera" : "Camera -> Screen"})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Dialog open={workspaceAlertOpen} onOpenChange={setWorkspaceAlertOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Workspace required</DialogTitle>
                  <DialogDescription>
                    Please select a workspace first.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button onClick={() => navigate("/workspaces")}>
                    Go
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </AppLayout>
        );
      }}
    />
  );
}