import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import VideoGrid from "@/components/meetings/VideoGrid";
import MeetingControls from "@/components/meetings/MeetingControls";
import MeetingChat from "@/components/meetings/MeetingChat";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { meetingsApi } from "@/lib/api";
import { useMeetingWebRTC } from "@/hooks/useMeetingWebRTC";
import { useMeetingChat } from "@/hooks/useMeetingChat";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

type LocationState = {
  meetingToken?: string;
};

export default function MeetingRoom() {
  const { t } = useTranslation(["meetings", "common"]);
  const { id } = useParams<{ id: string }>();
  const meetingId = Number(id);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [meetingToken, setMeetingToken] = useState<string | null>(
    (location.state as LocationState)?.meetingToken ?? null,
  );
  const [meetingTitle, setMeetingTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const userId = Number(user?.id);
  const displayName = user?.user_name || user?.email || "You";

  useEffect(() => {
    if (!meetingId) return;
    const load = async () => {
      setLoading(true);
      try {
        if (!meetingToken) {
          const joinRes = await meetingsApi.join(meetingId);
          setMeetingToken(joinRes.meetingToken || joinRes.data?.meetingToken);
          const meeting = joinRes.meeting || joinRes.data?.meeting;
          setMeetingTitle(meeting?.title || `Meeting #${meetingId}`);
        } else {
          const res = await meetingsApi.get(meetingId);
          const meeting = res.meeting || res.data?.meeting;
          setMeetingTitle(meeting?.title || `Meeting #${meetingId}`);
        }
      } catch (err) {
        toast({
          title: t("common:error"),
          description: (err as Error).message,
          variant: "destructive",
        });
        navigate("/meetings");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [meetingId, meetingToken, navigate, toast, t]);

  const webrtc = useMeetingWebRTC({
    meetingId,
    meetingToken: meetingToken || "",
    userId,
    enabled: Boolean(meetingToken && userId),
  });

  const chat = useMeetingChat(meetingId, Boolean(meetingToken));

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/meetings/${meetingId}`;
    void navigator.clipboard.writeText(url);
    toast({ title: t("meetings:room.linkCopied") });
  }, [meetingId, toast, t]);

  const handleLeave = useCallback(async () => {
    setLeaving(true);
    webrtc.leaveMeeting();
    navigate("/meetings");
  }, [webrtc, navigate]);

  const connectionLabel = {
    idle: t("meetings:room.state.idle"),
    connecting: t("meetings:room.state.connecting"),
    connected: t("meetings:room.state.connected"),
    reconnecting: t("meetings:room.state.reconnecting"),
    failed: t("meetings:room.state.failed"),
  }[webrtc.connectionState];

  if (loading || !meetingToken) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">{meetingTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {t("meetings:room.participantCount", {
                count: webrtc.remoteParticipants.length + 1,
              })}
            </p>
          </div>
          <Badge
            variant={
              webrtc.connectionState === "connected" ? "default" : "secondary"
            }
            className="gap-1"
          >
            {webrtc.connectionState === "connected" ||
            webrtc.connectionState === "connecting" ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {connectionLabel}
          </Badge>
        </div>

        {webrtc.error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {webrtc.error}
          </div>
        )}

        <div
          className={cn(
            "grid gap-4",
            chatOpen ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1",
          )}
        >
          <VideoGrid
            localStream={webrtc.localStream}
            localName={displayName}
            audioEnabled={webrtc.audioEnabled}
            videoEnabled={webrtc.videoEnabled}
            remoteParticipants={webrtc.remoteParticipants}
          />
          {chatOpen && (
            <MeetingChat
              className="min-h-[400px] lg:min-h-[500px]"
              messages={chat.messages}
              loading={chat.loading}
              currentUserId={userId}
              onSend={chat.sendMessage}
            />
          )}
        </div>

        <MeetingControls
          audioEnabled={webrtc.audioEnabled}
          videoEnabled={webrtc.videoEnabled}
          chatOpen={chatOpen}
          onToggleAudio={webrtc.toggleAudio}
          onToggleVideo={webrtc.toggleVideo}
          onToggleChat={() => setChatOpen((v) => !v)}
          onCopyLink={handleCopyLink}
          onLeave={() => void handleLeave()}
          leaving={leaving}
        />
      </div>
    </AppLayout>
  );
}
