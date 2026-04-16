import { type MutableRefObject, useState, useRef, useEffect } from "react";
import {
  getMediaStreams,
  createAudioMixer,
  setupRecording,
  cleanupRecording,
  createRecordingBlob,
  calculateRecordingDuration,
} from "@/lib/utils";

type MainSource = "screen" | "camera";

type StartRecordingOptions = {
  withMic?: boolean;
  withCamera?: boolean;
  mainSourceRef?: MutableRefObject<MainSource>;
  cameraEnabledRef?: MutableRefObject<boolean>;
  onDataAvailable?: (event: BlobEvent) => void;
  onStop?: () => void;
  onError?: (error: unknown) => void;
  onStreamsReady?: (streams: {
    displayStream: MediaStream;
    micStream: MediaStream | null;
    cameraStream: MediaStream | null;
    hasDisplayAudio: boolean;
  }) => void;
};

export const useScreenRecording = () => {
  const [state, setState] = useState<any>({
    isRecording: false,
    recordedBlob: null,
    recordedVideoUrl: "",
    recordingDuration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const drawLoopRef = useRef<number | null>(null);
  const hiddenDrawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const screenSourceVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraSourceVideoRef = useRef<HTMLVideoElement | null>(null);

  const stopDrawLoop = () => {
    if (drawLoopRef.current != null) {
      cancelAnimationFrame(drawLoopRef.current);
      drawLoopRef.current = null;
    }
    if (hiddenDrawTimeoutRef.current) {
      clearTimeout(hiddenDrawTimeoutRef.current);
      hiddenDrawTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
      if (state.recordedVideoUrl) URL.revokeObjectURL(state.recordedVideoUrl);
      audioContextRef.current?.close().catch(console.error);
      stopDrawLoop();
    };
  }, [state.recordedVideoUrl]);

  const handleRecordingStop = () => {
    const { blob, url } = createRecordingBlob(chunksRef.current);
    const duration = calculateRecordingDuration(startTimeRef.current);

    setState((prev) => ({
      ...prev,
      recordedBlob: blob,
      recordedVideoUrl: url,
      recordingDuration: duration,
      isRecording: false,
    }));
  };

  const startRecording = async (options: StartRecordingOptions = {}) => {
    const {
      withMic = true,
      withCamera = false,
      mainSourceRef,
      cameraEnabledRef,
      onDataAvailable,
      onStop,
      onError,
      onStreamsReady,
    } = options;

    try {
      stopRecording();

      const { displayStream, micStream, hasDisplayAudio } =
        await getMediaStreams(withMic);
      let cameraStream: MediaStream | null = null;
      if (withCamera) {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        } catch {
          cameraStream = null;
        }
      }
      displayStreamRef.current = displayStream;
      micStreamRef.current = micStream;
      cameraStreamRef.current = cameraStream;
      onStreamsReady?.({
        displayStream,
        micStream,
        cameraStream,
        hasDisplayAudio,
      });

      const screenVideo = document.createElement("video");
      screenVideo.srcObject = displayStream;
      screenVideo.muted = true;
      await screenVideo.play();
      screenSourceVideoRef.current = screenVideo;

      const cameraVideo = document.createElement("video");
      if (cameraStream) {
        cameraVideo.srcObject = cameraStream;
        cameraVideo.muted = true;
        await cameraVideo.play();
      }
      cameraSourceVideoRef.current = cameraVideo;

      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize recording canvas.");

      const drawCover = (
        video: HTMLVideoElement,
        dx: number,
        dy: number,
        dw: number,
        dh: number,
      ) => {
        const vw = video.videoWidth || dw;
        const vh = video.videoHeight || dh;
        const videoRatio = vw / vh;
        const targetRatio = dw / dh;
        let sx = 0;
        let sy = 0;
        let sw = vw;
        let sh = vh;
        if (videoRatio > targetRatio) {
          sw = vh * targetRatio;
          sx = (vw - sw) / 2;
        } else if (videoRatio < targetRatio) {
          sh = vw / targetRatio;
          sy = (vh - sh) / 2;
        }
        ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
      };

      const draw = () => {
        const activeScreenVideo = screenSourceVideoRef.current;
        const activeCamVideo = cameraSourceVideoRef.current;
        const cameraAllowed =
          cameraEnabledRef?.current ?? Boolean(cameraStream);
        const hasCamera = Boolean(
          cameraAllowed && activeCamVideo && activeCamVideo.videoWidth > 0,
        );
        const mainSource = mainSourceRef?.current ?? "screen";

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (mainSource === "camera" && hasCamera && activeCamVideo) {
          drawCover(activeCamVideo, 0, 0, canvas.width, canvas.height);
          if (activeScreenVideo && activeScreenVideo.videoWidth > 0) {
            const pipWidth = Math.round(canvas.width * 0.28);
            const pipHeight = Math.round((pipWidth * 9) / 16);
            const margin = 24;
            drawCover(
              activeScreenVideo,
              canvas.width - pipWidth - margin,
              canvas.height - pipHeight - margin,
              pipWidth,
              pipHeight,
            );
          }
        } else if (activeScreenVideo && activeScreenVideo.videoWidth > 0) {
          //   drawCover(activeScreenVideo, 0, 0, canvas.width, canvas.height);
          //   if (hasCamera && activeCamVideo) {
          //     const pipWidth = Math.round(canvas.width * 0.28);
          //     const pipHeight = Math.round((pipWidth * 9) / 16);
          //     const margin = 24;
          //     drawCover(
          //       activeCamVideo,
          //       canvas.width - pipWidth - margin,
          //       canvas.height - pipHeight - margin,
          //       pipWidth,
          //       pipHeight,
          //     );
          //   }
        }

        if (document.hidden) {
          hiddenDrawTimeoutRef.current = setTimeout(draw, 1000 / 15);
        } else {
          drawLoopRef.current = requestAnimationFrame(draw);
        }
      };
      draw();

      const combinedStream = new MediaStream();
      canvas
        .captureStream(30)
        .getVideoTracks()
        .forEach((track: MediaStreamTrack) => combinedStream.addTrack(track));

      audioContextRef.current = new AudioContext();
      const audioDestination = createAudioMixer(
        audioContextRef.current,
        displayStream,
        micStream,
        hasDisplayAudio,
      );

      audioDestination?.stream
        .getAudioTracks()
        .forEach((track: MediaStreamTrack) => combinedStream.addTrack(track));

      (combinedStream as any)._originalStreams = [
        displayStream,
        ...(micStream ? [micStream] : []),
        ...(cameraStream ? [cameraStream] : []),
      ];
      streamRef.current = combinedStream;

      mediaRecorderRef.current = setupRecording(combinedStream, {
        onDataAvailable: (e) => {
          if (e.data.size) chunksRef.current.push(e.data);
          onDataAvailable?.(e);
        },
        onStop: () => {
          handleRecordingStop();
          onStop?.();
        },
      });

      chunksRef.current = [];
      startTimeRef.current = Date.now();
      mediaRecorderRef.current.start(1000);
      setState((prev) => ({ ...prev, isRecording: true }));
      return true;
    } catch (error) {
      console.error("Recording error:", error);
      onError?.(error);
      return false;
    }
  };

  const stopRecording = () => {
    stopDrawLoop();
    screenSourceVideoRef.current = null;
    cameraSourceVideoRef.current = null;
    cleanupRecording(
      mediaRecorderRef.current,
      streamRef.current,
      (streamRef.current as any)?._originalStreams ?? null,
    );
    streamRef.current = null;
    displayStreamRef.current = null;
    cameraStreamRef.current = null;
    micStreamRef.current = null;
    setState((prev) => ({ ...prev, isRecording: false }));
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
    }
  };

  const resetRecording = () => {
    stopRecording();
    if (state.recordedVideoUrl) URL.revokeObjectURL(state.recordedVideoUrl);
    setState({
      isRecording: false,
      recordedBlob: null,
      recordedVideoUrl: "",
      recordingDuration: 0,
    });
    startTimeRef.current = null;
  };

  return {
    ...state,
    mediaRecorderRef,
    streamRef,
    displayStreamRef,
    cameraStreamRef,
    micStreamRef,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  };
};
