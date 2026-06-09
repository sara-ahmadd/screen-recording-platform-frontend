import { Mic, MicOff, PhoneOff, Video, VideoOff, MessageSquare, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MeetingControlsProps = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  chatOpen: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleChat: () => void;
  onCopyLink: () => void;
  onLeave: () => void;
  leaving?: boolean;
};

export default function MeetingControls({
  audioEnabled,
  videoEnabled,
  chatOpen,
  onToggleAudio,
  onToggleVideo,
  onToggleChat,
  onCopyLink,
  onLeave,
  leaving,
}: MeetingControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border bg-card p-3">
      <Button
        variant={audioEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleAudio}
        aria-label={audioEnabled ? "Mute" : "Unmute"}
      >
        {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>
      <Button
        variant={videoEnabled ? "secondary" : "destructive"}
        size="icon"
        onClick={onToggleVideo}
        aria-label={videoEnabled ? "Stop camera" : "Start camera"}
      >
        {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
      </Button>
      <Button
        variant={chatOpen ? "default" : "secondary"}
        size="icon"
        onClick={onToggleChat}
        aria-label="Toggle chat"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="icon" onClick={onCopyLink} aria-label="Copy invite link">
        <Link2 className="h-4 w-4" />
      </Button>
      <Button
        variant="destructive"
        className={cn("gap-2")}
        onClick={onLeave}
        disabled={leaving}
      >
        <PhoneOff className="h-4 w-4" />
        Leave
      </Button>
    </div>
  );
}
