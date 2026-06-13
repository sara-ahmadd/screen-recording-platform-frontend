import {
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Video,
  VideoOff,
  MessageSquare,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type MeetingControlsProps = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  chatOpen: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onCopyLink: () => void;
  onLeave: () => void;
  leaving?: boolean;
};

export default function MeetingControls({
  audioEnabled,
  videoEnabled,
  screenSharing,
  chatOpen,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onCopyLink,
  onLeave,
  leaving,
}: MeetingControlsProps) {
  const { t } = useTranslation(["meetings", "common"]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border bg-card p-3">
      <Button
        variant={audioEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleAudio}
        aria-label={
          audioEnabled
            ? t("meetings:room.controls.mute")
            : t("meetings:room.controls.unmute")
        }
      >
        {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>
      <Button
        variant={videoEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleVideo}
        disabled={screenSharing}
        aria-label={
          videoEnabled
            ? t("meetings:room.controls.stopCamera")
            : t("meetings:room.controls.startCamera")
        }
      >
        {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
      </Button>
      <Button
        variant={screenSharing ? "default" : "secondary"}
        size="icon"
        onClick={onToggleScreenShare}
        aria-label={
          screenSharing
            ? t("meetings:room.controls.stopScreenShare")
            : t("meetings:room.controls.shareScreen")
        }
      >
        {screenSharing ? (
          <MonitorOff className="h-4 w-4" />
        ) : (
          <Monitor className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant={chatOpen ? "default" : "secondary"}
        size="icon"
        onClick={onToggleChat}
        aria-label={t("meetings:room.controls.toggleChat")}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={onCopyLink}
        aria-label={t("meetings:room.controls.copyLink")}
      >
        <Link2 className="h-4 w-4" />
      </Button>
      <Button
        variant="destructive"
        className={cn("gap-2")}
        onClick={onLeave}
        disabled={leaving}
      >
        <PhoneOff className="h-4 w-4" />
        {t("meetings:room.controls.leave")}
      </Button>
    </div>
  );
}
