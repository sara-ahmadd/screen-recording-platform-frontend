import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { recordingsApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { Play, Download, Link2, Trash2, Droplets, Edit2, Loader2, ArrowLeft, RotateCcw, SearchX, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCurrentWorkspaceSubscription,
  hasSubscriptionPlanFeature,
} from "@/lib/workspaceSubscription";
import { resumeScreenRecordingFromServer } from "@/lib/resumeScreenUpload";
import { trackClientEvent } from "@/lib/analyticsClient";
import RecordingComments from "@/components/recordings/RecordingComments";

export default function RecordingDetailPage() {
  const { t } = useTranslation(["dashboard", "recording", "common"]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, selectedWorkspaceId } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirmDialog();
  const [recording, setRecording] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [publicLink, setPublicLink] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resumingUpload, setResumingUpload] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);
  const sizeInMb = typeof recording?.size === "number" ? (recording.size / (1024 * 1024)).toFixed(2) : null;
  const durationInMin = typeof recording?.duration === "number" ? (recording.duration / 60).toFixed(2) : null;
  const isPrivate = (recording?.visibility || "public") === "private";
  const recordingId = Number(id);

  const recordingStatusLabel = useMemo(() => {
    const status = recording?.status;
    if (!status) return "";
    const key = `statusLabels.${status}`;
    if (status === "processing") return t("detail.processingStatus");
    const translated = t(key, { defaultValue: "" });
    return translated || status;
  }, [recording?.status, t]);

  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceId || !user?.workspaces?.length) return null;
    return user.workspaces.find((w: any) => String(w.id) === selectedWorkspaceId) ?? null;
  }, [selectedWorkspaceId, user?.workspaces]);

  const currentWorkspaceSubscription = useMemo(() => {
    return getCurrentWorkspaceSubscription(selectedWorkspace);
  }, [selectedWorkspace]);

  const canDownloadVideo = useMemo(() => {
    return hasSubscriptionPlanFeature(
      currentWorkspaceSubscription,
      "canDownloadVideos",
    );
  }, [currentWorkspaceSubscription]);

  const canRemoveWatermark = useMemo(() => {
    return hasSubscriptionPlanFeature(
      currentWorkspaceSubscription,
      "canRemoveWaterMark",
    );
  }, [currentWorkspaceSubscription]);

  const isFreePlanWorkspace = useMemo(() => {
    const sub = getCurrentWorkspaceSubscription(selectedWorkspace);
    return String(sub?.plan?.name || "").toLowerCase() === "free";
  }, [selectedWorkspace]);

  const normalizeRecording = useCallback((rec: any) => {
    if (!rec) return rec;
    return {
      ...rec,
      videoUrl: rec.videoUrl || rec.video_url || rec.result?.videoUrl || rec.result?.video_url,
      thumbUrl:
        rec.thumbUrl ||
        rec.thumbnailUrl ||
        rec.thumbnail_url ||
        rec.result?.thumbnailUrl ||
        rec.result?.thumbnail_url,
    };
  }, []);

  const loadRecording = useCallback(async () => {
    const res = await recordingsApi.myRecordings({ limit: 100 });
    const recs = res.recordings || res.data || [];
    const rec = recs.find((r: any) => r.id === recordingId);
    if (rec) {
      const normalized = normalizeRecording(rec);
      setRecording(normalized);
      setNewTitle(normalized.title);
    }
  }, [normalizeRecording, recordingId]);

  useEffect(() => {
    async function load() {
      try {
        await loadRecording();
      } catch (err: any) {
        toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadRecording, toast]);

  useEffect(() => {
    const socket = getSocket();
    const getEventRecordingId = (data: any) =>
      Number(data?.recordingId ?? data?.id ?? data?.recording?.id ?? NaN);

    const onVideoReady = (data: any) => {
      const eventRecId = getEventRecordingId(data);
      const shouldApply = Number.isFinite(eventRecId)
        ? eventRecId === recordingId
        : true;
      if (!shouldApply) return;
      setRecording((prev: any) => {
        if (!prev) return prev;
        return normalizeRecording({
          ...prev,
          ...data,
          ...(data?.recording || {}),
          status: "ready",
          videoUrl:
            data?.videoUrl ||
            data?.video_url ||
            data?.result?.videoUrl ||
            data?.result?.video_url ||
            prev.videoUrl,
          thumbnailUrl:
            data?.thumbnailUrl ||
            data?.thumbnail_url ||
            data?.result?.thumbnailUrl ||
            data?.result?.thumbnail_url ||
            prev.thumbnailUrl,
          thumbUrl:
            data?.thumbUrl ||
            data?.thumbnailUrl ||
            data?.thumbnail_url ||
            data?.result?.thumbnailUrl ||
            data?.result?.thumbnail_url ||
            prev.thumbUrl,
        });
      });
      void loadRecording();
    };
    const onProcessing = (data: any) => {
      const eventRecId = getEventRecordingId(data);
      if (Number.isFinite(eventRecId) && eventRecId !== recordingId) return;
      setRecording((prev: any) => (prev ? { ...prev, status: "processing" } : prev));
    };
    const onFailed = (data: any) => {
      const eventRecId = getEventRecordingId(data);
      if (Number.isFinite(eventRecId) && eventRecId !== recordingId) return;
      setRecording((prev: any) => (prev ? { ...prev, status: "failed" } : prev));
      toast({ title: t("processingFailed"), description: data?.message || t("processingFailedDesc"), variant: "destructive" });
    };

    socket.on("video_ready", onVideoReady);
    socket.on("processing_initiated", onProcessing);
    socket.on("processing_failed", onFailed);

    return () => {
      socket.off("video_ready", onVideoReady);
      socket.off("processing_initiated", onProcessing);
      socket.off("processing_failed", onFailed);
    };
  }, [loadRecording, normalizeRecording, recordingId, recording?.status, toast]);

  const handleUpdate = async () => {
    try {
      const updateRes = await recordingsApi.update(Number(id), { title: newTitle });
      setRecording({ ...recording, title: newTitle });
      setEditing(false);
      toastApiSuccess(updateRes, { title: t("dashboard:updated"), fallbackDescription: t("dashboard:updatedDesc") });
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    }
  };

  const handleUpdateVisibility = async (visibility: "public" | "private") => {
    try {
      const visRes = await recordingsApi.update(Number(id), { visibility });
      setRecording({ ...recording, visibility });
      toastApiSuccess(visRes, {
        title: t("dashboard:visibilityUpdated"),
        fallbackDescription: t("dashboard:visibilityUpdatedDesc", {
          visibility: t(visibility === "public" ? "dashboard:public" : "dashboard:private"),
        }),
      });
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    const confirmed = await confirm({
      title: t("dashboard:moveToTrashConfirm"),
      description: t("dashboard:moveToTrashDesc"),
      confirmText: t("dashboard:moveToTrashAction"),
      cancelText: t("common:actions.cancel"),
    });
    if (!confirmed) return;
    try {
      setDeleting(true);
      const delRes = await recordingsApi.delete(Number(id));
      toastApiSuccess(delRes, {
        title: t("dashboard:movedToTrash"),
        fallbackDescription: t("dashboard:movedToTrashDesc"),
      });
      trackClientEvent({
        eventType: "click",
        eventName: "recording_moved_to_trash",
        metadata: { recordingId: Number(id), route: `/recording/${id}` },
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePermanently = async () => {
    if (deleting) return;
    const confirmed = await confirm({
      title: t("dashboard:deletePermanently"),
      description: t("dashboard:permanentDeleteConfirm"),
      confirmText: t("dashboard:deletePermanentlyMenu"),
      cancelText: t("common:actions.cancel"),
    });
    if (!confirmed) return;
    try {
      setDeleting(true);
      const delRes = await recordingsApi.delete(Number(id), undefined, {
        permanent: true,
      });
      toastApiSuccess(delRes, {
        title: t("dashboard:deletedPermanently"),
        fallbackDescription: t("dashboard:deletedPermanentlyDesc"),
      });
      trackClientEvent({
        eventType: "click",
        eventName: "recording_permanently_deleted",
        metadata: { recordingId: Number(id), route: `/recording/${id}` },
      });
      navigate("/dashboard");
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("not found")) {
        toast({
          variant: "success",
          title: t("dashboard:alreadyDeleted"),
          description: t("dashboard:alreadyDeletedDesc"),
        });
        navigate("/dashboard");
      } else {
        toast({ title: t("common:toast.error"), description: msg, variant: "destructive" });
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await recordingsApi.downloadVideo(Number(id));
      const downloadUrl = res.downloadUrl || res.url;
      if (downloadUrl) window.open(downloadUrl, "_blank");
      else toastApiSuccess(res, { title: t("dashboard:downloadStarted"), fallbackDescription: t("dashboard:downloadStartedDesc") });
    } catch (err: any) {
      toast({ title: t("dashboard:downloadNotAvailable"), description: err.message, variant: "destructive" });
    }
  };

  const handleGetPublicLink = async () => {
    try {
      const res = await recordingsApi.getPublicLink(Number(id));
      const link = res.shareLink || res.link || res.url || res.publicLink;
      setPublicLink(link);
      setShareDialogOpen(true);
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveWatermark = async () => {
    try {
      const wmRes = await recordingsApi.removeWatermark(Number(id));
      setRecording((prev: any) =>
        prev
          ? {
              ...prev,
              status: "processing",
              videoUrl: "",
              video_url: "",
              thumbUrl: "",
              thumbnailUrl: "",
              thumbnail_url: "",
            }
          : prev
      );
      toastApiSuccess(wmRes, {
        title: t("dashboard:watermarkRemoval"),
        fallbackDescription: t("dashboard:watermarkRemovalDesc"),
      });
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    }
  };

  const handleReprocess = async () => {
    if (!recording || (recording.status !== "failed" && recording.status !== "uploaded")) {
      return;
    }
    try {
      setReprocessing(true);
      const res = await recordingsApi.reprocess(Number(id));
      setRecording((prev: any) => (prev ? { ...prev, status: "processing" } : prev));
      toastApiSuccess(res, {
        title: t("dashboard:retrySuccess"),
        fallbackDescription: t("dashboard:retryDesc"),
      });
    } catch (err: any) {
      toast({ title: t("dashboard:retryFailed"), description: err.message, variant: "destructive" });
    } finally {
      setReprocessing(false);
    }
  };

  const handleResumeUpload = useCallback(async () => {
    if (!Number.isFinite(recordingId) || resumingUpload) return;
    setResumingUpload(true);
    setResumeProgress(0);
    try {
      await resumeScreenRecordingFromServer(recordingId, {
        onProgress: (pct) => setResumeProgress(pct),
      });
      setRecording((prev: any) => (prev ? { ...prev, status: "processing" } : prev));
      toast({
        variant: "success",
        title: t("dashboard:uploadResumed"),
        description: t("dashboard:uploadResumedDesc"),
      });
      await loadRecording();
    } catch (err: any) {
      toast({
        title: t("dashboard:resumeFailed"),
        description: err?.message || t("dashboard:resumeFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setResumingUpload(false);
      setResumeProgress(0);
    }
  }, [loadRecording, recordingId, resumingUpload, toast]);

  useEffect(() => {
    if (loading || !recording) return;
    if (searchParams.get("resumeUpload") !== "1") return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("resumeUpload");
    setSearchParams(nextParams, { replace: true });
    void handleResumeUpload();
  }, [handleResumeUpload, loading, recording, searchParams, setSearchParams]);

  if (loading) {
    return <AppLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  if (!recording) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <Card className="glass border-border/70 shadow-lg w-full max-w-3xl">
            <CardContent className="py-16 px-6 md:px-10 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/70">
                <SearchX className="h-7 w-7 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{t("notFoundTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                {t("notFoundDesc")}
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={() => navigate("/dashboard")} className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {t("backToDashboard")}
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  {t("detail.refresh")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
        <Button variant="ghost" className="mb-4 text-muted-foreground" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("detail.back")}
        </Button>

        {/* Video player */}
        <Card className="glass mb-6 overflow-hidden">
          <div className="aspect-video bg-secondary/30 flex items-center justify-center">
            {recording.videoUrl ? (
              <video
                src={recording.videoUrl}
                controls
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && ["s", "u", "p"].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                  }
                }}
                className="w-full h-full"
              />
            ) : (
              <div className="text-center">
                <Play className="h-16 w-16 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  {recording.status === "processing"
                    ? t("dashboard:detail.videoProcessing")
                    : t("dashboard:detail.videoUnavailable")}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Info & actions */}
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                {editing ? (
                  <div className="flex gap-2">
                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                    <Button size="sm" onClick={handleUpdate}>{t("detail.save")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>{t("common:actions.cancel")}</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{recording.title}</h2>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditing(true)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {t("detail.created", { date: new Date(recording.createdAt).toLocaleString() })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("detail.size")}: {sizeInMb ? `${sizeInMb} ${t("detail.mb")}` : "-"} • {t("detail.duration")}: {durationInMin ? `${durationInMin} ${t("detail.min")}` : "-"}
                </p>
                <div className="mt-3 max-w-[180px]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{t("detail.visibility")}</p>
                  <Select
                    value={(recording.visibility || "public") as "public" | "private"}
                    onValueChange={(v: "public" | "private") => handleUpdateVisibility(v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{t("detail.public")}</SelectItem>
                      <SelectItem value="private">{t("detail.private")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Badge className={recording.status === "ready" ? "bg-success/20 text-success border-0 hover:bg-success/20" : "bg-warning/20 text-warning border-0 hover:bg-warning/20"}>
                {recording.status === "processing" ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    {t("detail.processingStatus")}
                  </>
                ) : (
                  recordingStatusLabel
                )}
              </Badge>
            </div>

            {(resumingUpload || resumeProgress > 0) && (
              <div className="mb-5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                <p className="text-sm font-medium text-amber-600 mb-2">
                  {t("detail.resumingUpload")}
                </p>
                <Progress value={resumeProgress} className="h-2" />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {recording.status === "uploading" && (
                <Button variant="outline" className="gap-2" onClick={() => void handleResumeUpload()} disabled={resumingUpload}>
                  {resumingUpload ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {t("detail.resumeUpload")}
                </Button>
              )}
              {!canDownloadVideo ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex" tabIndex={0}>
                      <Button variant="outline" className="gap-2" disabled>
                        <Download className="h-4 w-4" /> {t("detail.download")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[100] max-w-[260px] whitespace-normal text-center">
                    {t("detail.planNoDownload")}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button variant="outline" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" /> {t("detail.download")}
                </Button>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button variant="outline" onClick={handleGetPublicLink} className="gap-2" disabled={isPrivate}>
                      <Link2 className="h-4 w-4" /> {t("detail.shareLink")}
                    </Button>
                  </span>
                </TooltipTrigger>
                {isPrivate && (
                  <TooltipContent>
                    {t("detail.privateShareBlocked")}
                  </TooltipContent>
                )}
              </Tooltip>
              {!canRemoveWatermark ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex" tabIndex={0}>
                      <Button variant="outline" className="gap-2" disabled>
                        <Droplets className="h-4 w-4" /> {t("detail.removeWatermark")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[100] max-w-[260px] whitespace-normal text-center">
                    {t("detail.planNoWatermark")}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button variant="outline" onClick={handleRemoveWatermark} className="gap-2">
                  <Droplets className="h-4 w-4" /> {t("detail.removeWatermark")}
                </Button>
              )}
              {(recording.status === "failed" || recording.status === "uploaded") && (
                <Button variant="outline" onClick={handleReprocess} className="gap-2" disabled={reprocessing}>
                  {reprocessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {t("detail.retryProcessing")}
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}{" "}
                {t("detail.moveToTrash")}
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-white gap-2"
                onClick={handleDeletePermanently}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" /> {t("detail.deletePermanently")}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("trashNote")}
            </p>

          </CardContent>
        </Card>

        {recordingId > 0 && recording?.status === "ready" && (
          <RecordingComments recordingId={recordingId} />
        )}

        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("detail.shareTitle")}</DialogTitle>
              <DialogDescription>{t("detail.shareDesc")}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <a
                href={publicLink}
                target="_blank"
                rel="noreferrer"
                className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm underline underline-offset-2 hover:text-primary transition-colors truncate"
                title={publicLink}
              >
                {publicLink}
              </a>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
