import { useEffect, useState, useCallback } from "react";
import { recordingsApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { messageFromApiSuccessResponse } from "@/lib/apiMessage";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { Upload, Play, Clock, AlertCircle, ChevronLeft, ChevronRight, Trash2, Loader2, ArrowUpDown, Calendar as CalendarIcon, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { trackClientEvent } from "@/lib/analyticsClient";

interface Recording {
  id: number;
  title: string;
  status: string;
  visibility: string;
  createdAt: string;
  videoUrl?: string;
  thumbUrl?: string;
  duration?: number;
  multipartUploadId?: string;
  cameraMultipartUploadId?: string;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const confirm = useConfirmDialog();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [order, setOrder] = useState<"DESC" | "ASC">("DESC");
  const [titleFilter, setTitleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>();
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>();
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>();
  const limit = 12;

  const formatDateForApi = (date?: Date) => (date ? date.toLocaleDateString("en-US") : undefined);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recordingsApi.myRecordings({
        page,
        limit,
        order,
        filters: {
          title: titleFilter.trim() || undefined,
          status: statusFilter.trim() || undefined,
          visibility: visibilityFilter.trim() || undefined,
          startDate: formatDateForApi(startDateFilter),
          endDate: formatDateForApi(endDateFilter),
        },
      });
      setRecordings(res.recordings || res.data || []);
      setTotal(res.total || res.count || 0);
    } catch (err: any) {
      toast({ title: "Error loading recordings", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, order, titleFilter, statusFilter, visibilityFilter, startDateFilter, endDateFilter, toast]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  useEffect(() => {
    setPage(1);
  }, [titleFilter, statusFilter, visibilityFilter, startDateFilter, endDateFilter, order]);

  const resetFilters = () => {
    setTitleFilter("");
    setStatusFilter("");
    setVisibilityFilter("");
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
    setPage(1);
  };

  // Socket.IO events
  useEffect(() => {
    const socket = getSocket();
    const getEventRecordingId = (data: any) =>
      Number(data?.recordingId ?? data?.recording?.id ?? data?.id ?? NaN);

    const onVideoReady = (data: any) => {
      const eventRecId = getEventRecordingId(data);
      const nextVideoUrl =
        data?.videoUrl || data?.video_url || data?.result?.videoUrl || data?.result?.video_url;
      const nextThumbUrl =
        data?.thumbUrl ||
        data?.thumbnailUrl ||
        data?.thumbnail_url ||
        data?.result?.thumbnailUrl ||
        data?.result?.thumbnail_url;

      setRecordings((prev) => {
        if (prev.length === 0) return prev;
        if (Number.isFinite(eventRecId)) {
          return prev.map((r) =>
            r.id === eventRecId
              ? {
                  ...r,
                  status: "ready",
                  videoUrl: nextVideoUrl || r.videoUrl,
                  thumbUrl: nextThumbUrl || r.thumbUrl,
                }
              : r,
          );
        }
        const firstProcessingIdx = prev.findIndex((r) => r.status === "processing");
        if (firstProcessingIdx === -1) return prev;
        return prev.map((r, idx) =>
          idx === firstProcessingIdx
            ? {
                ...r,
                status: "ready",
                videoUrl: nextVideoUrl || r.videoUrl,
                thumbUrl: nextThumbUrl || r.thumbUrl,
              }
            : r,
        );
      });

      toast({
        variant: "success",
        title: "Video ready!",
        description:
          messageFromApiSuccessResponse(data) ?? data?.title ?? "Your recording is ready.",
      });
      fetchRecordings();
    };
    const onProcessing = (data: any) => {
      const eventRecId = getEventRecordingId(data);
      if (!Number.isFinite(eventRecId)) return;
      setRecordings((prev) =>
        prev.map((r) => (r.id === eventRecId ? { ...r, status: "processing" } : r)),
      );
    };
    const onFailed = (data: any) => {
      toast({ title: "Processing failed", description: data?.message || "Something went wrong.", variant: "destructive" });
      fetchRecordings();
    };
    const onDeleted = () => fetchRecordings();
    const onLimitWarning = (data: any) => {
      toast({ title: "⚠️ Usage warning", description: data?.message || "You're approaching your plan limits." });
    };

    socket.on("video_ready", onVideoReady);
    socket.on("processing_initiated", onProcessing);
    socket.on("processing_failed", onFailed);
    socket.on("video_deleted", onDeleted);
    socket.on("limit_warning", onLimitWarning);

    return () => {
      socket.off("video_ready", onVideoReady);
      socket.off("processing_initiated", onProcessing);
      socket.off("processing_failed", onFailed);
      socket.off("video_deleted", onDeleted);
      socket.off("limit_warning", onLimitWarning);
    };
  }, [fetchRecordings, toast]);

  const handleCancelStuckUpload = async (id: number) => {
    const confirmed = await confirm({
      title: "Cancel this upload?",
      description:
        "The in-progress file transfer will be stopped and the draft will be reset. You can start a new upload afterward.",
      confirmText: "Cancel upload",
      cancelText: "Keep",
    });
    if (!confirmed) return;
    try {
      const res = await recordingsApi.abortMultipartUpload(id);
      toastApiSuccess(res, {
        title: "Upload cancelled",
        fallbackDescription: "You can record or upload again.",
      });
      fetchRecordings();
    } catch (err: any) {
      toast({ title: "Could not cancel upload", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Delete recording?",
      description: "This recording will be permanently removed.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      const delRes = await recordingsApi.delete(id);
      toastApiSuccess(delRes, {
        title: "Recording deleted",
        fallbackDescription: "Recording deleted.",
      });
      fetchRecordings();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdateVisibility = async (rec: Recording, nextVisibility: "public" | "private") => {
    try {
      const visRes = await recordingsApi.update(rec.id, { visibility: nextVisibility });
      setRecordings((prev) =>
        prev.map((item) => (item.id === rec.id ? { ...item, visibility: nextVisibility } : item))
      );
      toastApiSuccess(visRes, {
        title: "Visibility updated",
        fallbackDescription: `Visibility set to ${nextVisibility}.`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ready": return <Badge className="bg-success/20 text-success border-0 hover:bg-success/20">Ready</Badge>;
      case "processing": return <Badge className="bg-warning/20 text-warning border-0 hover:bg-warning/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "failed": return <Badge variant="destructive" className="hover:bg-destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default: return <Badge variant="secondary" className="hover:bg-secondary">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Recordings</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} recording{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setOrder((prev) => (prev === "DESC" ? "ASC" : "DESC"))}
            >
              <ArrowUpDown className="h-4 w-4" />
              Order: {order === "DESC" ? "Newest" : "Oldest"}
            </Button>
            <Link
              to="/record"
              onClick={() =>
                trackClientEvent({
                  eventType: "click",
                  eventName: "dashboard_nav_record",
                  metadata: { placement: "header_toolbar" },
                })
              }
            >
              <Button className="gradient-primary gap-2">
                <Upload className="h-4 w-4" /> New Recording
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-6 mb-6">
          <Input
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            placeholder="Filter by title (e.g. test)"
          />
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="uploading">Uploading</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
            </SelectContent>
          </Select>
          <Select value={visibilityFilter || "all"} onValueChange={(v) => setVisibilityFilter(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visibility</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-start text-left font-normal", !startDateFilter && !endDateFilter && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDateFilter
                  ? `${startDateFilter.toLocaleDateString()} - ${endDateFilter ? endDateFilter.toLocaleDateString() : "..."}`
                  : "Select date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div>
                <Calendar
                  mode="range"
                  selected={{ from: startDateFilter, to: endDateFilter }}
                  onSelect={(range: any) => {
                    setStartDateFilter(range?.from);
                    setEndDateFilter(range?.to);
                    if (range?.to) setHoveredDate(undefined);
                  }}
                  onDayMouseEnter={(day) => setHoveredDate(day)}
                  modifiers={{
                    hoverRange:
                      startDateFilter && !endDateFilter && hoveredDate
                        ? (day) =>
                            day > startDateFilter &&
                            day < hoveredDate
                        : undefined,
                    hoverRangeEnd:
                      startDateFilter && !endDateFilter && hoveredDate
                        ? (day) => day.getTime() === hoveredDate.getTime()
                        : undefined,
                  }}
                  modifiersClassNames={{
                    hoverRange: "bg-accent text-accent-foreground",
                    hoverRangeEnd:
                      "bg-primary text-primary-foreground rounded-md",
                  }}
                  numberOfMonths={2}
                />
                <div className="border-t border-border p-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStartDateFilter(undefined);
                      setEndDateFilter(undefined);
                      setHoveredDate(undefined);
                    }}
                  >
                    Reset date range
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={resetFilters}>Reset filters</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : recordings.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="gradient-primary rounded-2xl p-4 mb-4">
                <Play className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first screen recording to get started.</p>
              <Link
                to="/upload"
                onClick={() =>
                  trackClientEvent({
                    eventType: "click",
                    eventName: "dashboard_nav_upload",
                    metadata: { placement: "empty_state" },
                  })
                }
              >
                <Button className="gradient-primary">Upload Recording</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordings.map((rec) => (
                <Card key={rec.id} className="glass group hover:border-primary/30 transition-all animate-fade-in">
                  <CardContent className="p-0">
                    <Link to={`/recording/${rec.id}`}>
                      <div className="aspect-video bg-secondary/50 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                        {rec.thumbUrl ? (
                          <img src={rec.thumbUrl} alt={rec.title} className="w-full h-full object-cover" />
                        ) : (
                          <Play className="h-10 w-10 text-muted-foreground/40" />
                        )}
                        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity gradient-primary rounded-full p-3">
                            <Play className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/recording/${rec.id}`} className="flex-1 min-w-0">
                          <h3 className="font-medium truncate hover:text-primary transition-colors">{rec.title}</h3>
                        </Link>
                        {statusBadge(rec.status)}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(rec.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {(rec.status === "uploading" || rec.cameraMultipartUploadId) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0" aria-label="Upload actions">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/record?resumeScreenId=${rec.id}`}>Finish screen</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/upload?resumeRecordingId=${rec.id}`}>Resume file</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-white"
                                  onSelect={() => {
                                    void handleCancelStuckUpload(rec.id);
                                  }}
                                >
                                  Cancel upload
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Visibility</span>
                            <Select
                              value={(rec.visibility || "public") as "public" | "private"}
                              onValueChange={(v: "public" | "private") => handleUpdateVisibility(rec, v)}
                            >
                              <SelectTrigger className="h-7 w-[96px] text-[11px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="private">Private</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-white" onClick={() => handleDelete(rec.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
