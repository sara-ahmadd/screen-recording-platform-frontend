import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getMediaStreams = async (
  withMic: boolean,
): Promise<{
  displayStream: MediaStream;
  micStream: MediaStream | null;
  hasDisplayAudio: boolean;
}> => {
  const displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { ideal: 3840 },
      height: { ideal: 2160 },
      frameRate: { ideal: 30 },
    },
    audio: true,
  });

  const hasDisplayAudio = displayStream.getAudioTracks().length > 0;
  let micStream: MediaStream | null = null;

  if (withMic) {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStream
      .getAudioTracks()
      .forEach((track: MediaStreamTrack) => (track.enabled = true));
  }

  return { displayStream, micStream, hasDisplayAudio };
};

export const createAudioMixer = (
  ctx: AudioContext,
  displayStream: MediaStream,
  micStream: MediaStream | null,
  hasDisplayAudio: boolean,
) => {
  if (!hasDisplayAudio && !micStream) return null;

  const destination = ctx.createMediaStreamDestination();
  const mix = (stream: MediaStream, gainValue: number) => {
    const source = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    source.connect(gain).connect(destination);
  };

  if (hasDisplayAudio) mix(displayStream, 0.7);
  if (micStream) mix(micStream, 1.5);

  return destination;
};

export const setupMediaRecorder = (stream: MediaStream) => {
  try {
    return new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
      videoBitsPerSecond: 20_000_000,
      audioBitsPerSecond: 192_000,
    });
  } catch {
    return new MediaRecorder(stream);
  }
};

export const getVideoDuration = (url: string): Promise<number | null> =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration =
        isFinite(video.duration) && video.duration > 0
          ? Math.round(video.duration)
          : null;
      URL.revokeObjectURL(video.src);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
    video.src = url;
  });

export const setupRecording = (
  stream: MediaStream,
  handlers: { onDataAvailable: (event: BlobEvent) => void; onStop: () => void },
): MediaRecorder => {
  const recorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp8",
    videoBitsPerSecond: 20_000_000,
    audioBitsPerSecond: 192_000,
  });
  recorder.ondataavailable = handlers.onDataAvailable;
  recorder.onstop = handlers.onStop;
  return recorder;
};

export const cleanupRecording = (
  recorder: MediaRecorder | null,
  stream: MediaStream | null,
  originalStreams: MediaStream[] | null = null,
) => {
  if (recorder?.state !== "inactive") {
    recorder?.stop();
  }

  stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
  (originalStreams ?? []).forEach((s) =>
    s.getTracks().forEach((track: MediaStreamTrack) => track.stop()),
  );
};

export const createRecordingBlob = (
  chunks: Blob[],
): { blob: Blob; url: string } => {
  const blob = new Blob(chunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  return { blob, url };
};

export const calculateRecordingDuration = (startTime: number | null): number =>
  startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
