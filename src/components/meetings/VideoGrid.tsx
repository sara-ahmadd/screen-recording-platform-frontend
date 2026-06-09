import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { RemoteParticipant } from "@/hooks/useMeetingWebRTC";
import { MicOff, VideoOff } from "lucide-react";

type VideoTileProps = {
  stream?: MediaStream | null;
  displayName: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  isLocal?: boolean;
  className?: string;
};

function VideoTile({
  stream,
  displayName,
  audioEnabled = true,
  videoEnabled = true,
  isLocal,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const showVideo = videoEnabled && stream;

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-lg border bg-muted",
        className,
      )}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-lg font-semibold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
        <span>{isLocal ? `${displayName} (You)` : displayName}</span>
        {!audioEnabled && <MicOff className="h-3 w-3" />}
        {!videoEnabled && <VideoOff className="h-3 w-3" />}
      </div>
    </div>
  );
}

type VideoGridProps = {
  localStream: MediaStream | null;
  localName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  remoteParticipants: RemoteParticipant[];
};

export default function VideoGrid({
  localStream,
  localName,
  audioEnabled,
  videoEnabled,
  remoteParticipants,
}: VideoGridProps) {
  const total = remoteParticipants.length + 1;
  const gridClass =
    total <= 1
      ? "grid-cols-1"
      : total <= 2
        ? "grid-cols-1 md:grid-cols-2"
        : total <= 4
          ? "grid-cols-2"
          : "grid-cols-2 md:grid-cols-3";

  return (
    <div className={cn("grid gap-3", gridClass)}>
      <VideoTile
        stream={localStream}
        displayName={localName}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isLocal
      />
      {remoteParticipants.map((p) => (
        <VideoTile
          key={p.userId}
          stream={p.stream}
          displayName={p.displayName}
          audioEnabled={p.audioEnabled}
          videoEnabled={p.videoEnabled}
        />
      ))}
    </div>
  );
}
