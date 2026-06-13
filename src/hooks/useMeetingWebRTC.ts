import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectMeetingsSocket,
  getMeetingsSocket,
  MEETING_SOCKET_EVENTS,
} from "@/lib/meetingsSocket";

export type RemoteParticipant = {
  userId: number;
  displayName: string;
  avatarUrl?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing?: boolean;
  stream?: MediaStream;
};

type UseMeetingWebRTCOptions = {
  meetingId: number;
  meetingToken: string;
  userId: number;
  enabled: boolean;
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function buildOutboundStream(
  videoTrack: MediaStreamTrack | null,
  audioTracks: MediaStreamTrack[],
) {
  const stream = new MediaStream();
  if (videoTrack) stream.addTrack(videoTrack);
  audioTracks.forEach((t) => stream.addTrack(t));
  return stream;
}

export function useMeetingWebRTC({
  meetingId,
  meetingToken,
  userId,
  enabled,
}: UseMeetingWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    Map<number, RemoteParticipant>
  >(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "connected" | "reconnecting" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const meetingTokenRef = useRef(meetingToken);
  const joinedRef = useRef(false);
  const screenSharingRef = useRef(false);

  meetingTokenRef.current = meetingToken;
  screenSharingRef.current = screenSharing;

  const emitMediaState = useCallback(
    (state: {
      audioEnabled: boolean;
      videoEnabled: boolean;
      screenSharing: boolean;
    }) => {
      getMeetingsSocket().emit(MEETING_SOCKET_EVENTS.mediaState, state);
    },
    [],
  );

  const updateRemote = useCallback((participant: RemoteParticipant) => {
    setRemoteParticipants((prev) => {
      const next = new Map(prev);
      const existing = next.get(participant.userId);
      next.set(participant.userId, {
        ...existing,
        ...participant,
        stream: participant.stream ?? existing?.stream,
      });
      return next;
    });
  }, []);

  const removeRemote = useCallback((remoteUserId: number) => {
    const pc = peersRef.current.get(remoteUserId);
    if (pc) {
      pc.close();
      peersRef.current.delete(remoteUserId);
    }
    setRemoteParticipants((prev) => {
      const next = new Map(prev);
      next.delete(remoteUserId);
      return next;
    });
  }, []);

  const renegotiateAllPeers = useCallback(async () => {
    const socket = getMeetingsSocket();
    for (const [remoteUserId, pc] of peersRef.current.entries()) {
      if (
        pc.signalingState !== "stable" &&
        pc.signalingState !== "have-local-offer"
      ) {
        continue;
      }
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit(MEETING_SOCKET_EVENTS.webrtcOffer, {
          targetUserId: remoteUserId,
          sdp: offer,
        });
      } catch {
        // ignore renegotiation errors during transient states
      }
    }
  }, []);

  const replaceOutgoingVideoTrack = useCallback(
    async (newVideoTrack: MediaStreamTrack | null) => {
      for (const [, pc] of peersRef.current.entries()) {
        const videoSender = pc
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        } else if (newVideoTrack && localStreamRef.current) {
          pc.addTrack(newVideoTrack, localStreamRef.current);
        }
      }
      await renegotiateAllPeers();
    },
    [renegotiateAllPeers],
  );

  const createPeerConnection = useCallback(
    (remoteUserId: number) => {
      let pc = peersRef.current.get(remoteUserId);
      if (pc) return pc;

      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        getMeetingsSocket().emit(MEETING_SOCKET_EVENTS.webrtcIce, {
          targetUserId: remoteUserId,
          candidate: event.candidate.toJSON(),
        });
      };

      pc.ontrack = (event) => {
        const stream =
          event.streams[0] ??
          (() => {
            const s = new MediaStream();
            s.addTrack(event.track);
            return s;
          })();
        updateRemote({
          userId: remoteUserId,
          displayName: `User ${remoteUserId}`,
          audioEnabled: true,
          videoEnabled: true,
          stream,
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          pc.restartIce();
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc!.addTrack(track, localStreamRef.current!);
        });
      }

      peersRef.current.set(remoteUserId, pc);
      return pc;
    },
    [updateRemote],
  );

  const makeOffer = useCallback(
    async (remoteUserId: number) => {
      if (remoteUserId === userId) return;
      const pc = createPeerConnection(remoteUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      getMeetingsSocket().emit(MEETING_SOCKET_EVENTS.webrtcOffer, {
        targetUserId: remoteUserId,
        sdp: offer,
      });
    },
    [createPeerConnection, userId],
  );

  const stopScreenShareInternal = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    screenSharingRef.current = false;
    setScreenSharing(false);

    const camera = cameraStreamRef.current;
    if (!camera) return;

    const cameraVideo = camera.getVideoTracks()[0] ?? null;
    const audioTracks = camera.getAudioTracks();
    const outbound = buildOutboundStream(cameraVideo, audioTracks);
    localStreamRef.current = outbound;
    setLocalStream(outbound);

    await replaceOutgoingVideoTrack(cameraVideo);
    emitMediaState({
      audioEnabled,
      videoEnabled: cameraVideo?.enabled ?? videoEnabled,
      screenSharing: false,
    });
  }, [audioEnabled, videoEnabled, emitMediaState, replaceOutgoingVideoTrack]);

  const startScreenShare = useCallback(async () => {
    if (screenSharingRef.current) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) {
        screenStream.getTracks().forEach((t) => t.stop());
        return;
      }

      screenStreamRef.current = screenStream;
      screenSharingRef.current = true;
      setScreenSharing(true);
      setVideoEnabled(true);

      screenTrack.onended = () => {
        void stopScreenShareInternal();
      };

      const camera = cameraStreamRef.current;
      const audioTracks = camera?.getAudioTracks() ?? [];
      const outbound = buildOutboundStream(screenTrack, audioTracks);
      localStreamRef.current = outbound;
      setLocalStream(outbound);

      await replaceOutgoingVideoTrack(screenTrack);
      emitMediaState({
        audioEnabled,
        videoEnabled: true,
        screenSharing: true,
      });
    } catch (err) {
      if ((err as DOMException).name !== "NotAllowedError") {
        setError("Could not share screen");
      }
    }
  }, [
    audioEnabled,
    emitMediaState,
    replaceOutgoingVideoTrack,
    stopScreenShareInternal,
  ]);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharingRef.current) {
      await stopScreenShareInternal();
    } else {
      await startScreenShare();
    }
  }, [startScreenShare, stopScreenShareInternal]);

  const joinMeetingRoom = useCallback(async () => {
    const socket = getMeetingsSocket();
    connectMeetingsSocket();

    if (!cameraStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        cameraStreamRef.current = stream;
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        setError("Could not access camera or microphone");
        setConnectionState("failed");
        throw err;
      }
    }

    setConnectionState("connecting");
    socket.emit(MEETING_SOCKET_EVENTS.join, {
      meetingToken: meetingTokenRef.current,
      audioEnabled,
      videoEnabled,
    });
  }, [audioEnabled, videoEnabled]);

  useEffect(() => {
    if (!enabled || !meetingToken) return;

    const socket = getMeetingsSocket();
    connectMeetingsSocket();

    const onJoined = (payload: {
      participants: RemoteParticipant[];
      reconnected?: boolean;
    }) => {
      joinedRef.current = true;
      setConnectionState("connected");
      setError(null);

      payload.participants.forEach((p) => {
        if (p.userId === userId) return;
        updateRemote(p);
        if (userId < p.userId) {
          void makeOffer(p.userId);
        }
      });
    };

    const onUserJoined = (payload: { participant: RemoteParticipant }) => {
      const p = payload.participant;
      if (p.userId === userId) return;
      updateRemote(p);
      if (userId < p.userId) {
        void makeOffer(p.userId);
      }
    };

    const onUserLeft = (payload: { userId: number }) => {
      removeRemote(payload.userId);
    };

    const onParticipants = (payload: { participants: RemoteParticipant[] }) => {
      const ids = new Set(payload.participants.map((p) => p.userId));
      payload.participants.forEach((p) => {
        if (p.userId !== userId) updateRemote(p);
      });
      peersRef.current.forEach((_, id) => {
        if (id !== userId && !ids.has(id)) removeRemote(id);
      });
    };

    const onOffer = async (payload: {
      fromUserId: number;
      sdp: RTCSessionDescriptionInit;
    }) => {
      if (payload.fromUserId === userId) return;
      const pc = createPeerConnection(payload.fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit(MEETING_SOCKET_EVENTS.webrtcAnswer, {
        targetUserId: payload.fromUserId,
        sdp: answer,
      });
    };

    const onAnswer = async (payload: {
      fromUserId: number;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const pc = peersRef.current.get(payload.fromUserId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    };

    const onIce = async (payload: {
      fromUserId: number;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peersRef.current.get(payload.fromUserId);
      if (!pc || !payload.candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch {
        // ignore stale candidates during renegotiation
      }
    };

    const onMediaState = (payload: {
      userId: number;
      audioEnabled: boolean;
      videoEnabled: boolean;
      screenSharing?: boolean;
    }) => {
      updateRemote({
        userId: payload.userId,
        displayName: `User ${payload.userId}`,
        audioEnabled: payload.audioEnabled,
        videoEnabled: payload.videoEnabled,
        screenSharing: payload.screenSharing ?? false,
      });
    };

    const onError = (payload: { message: string }) => {
      setError(payload.message);
    };

    const onDisconnect = () => {
      if (joinedRef.current) setConnectionState("reconnecting");
    };

    const onConnect = () => {
      if (joinedRef.current) {
        void joinMeetingRoom();
      }
    };

    socket.on(MEETING_SOCKET_EVENTS.joined, onJoined);
    socket.on(MEETING_SOCKET_EVENTS.userJoined, onUserJoined);
    socket.on(MEETING_SOCKET_EVENTS.userLeft, onUserLeft);
    socket.on(MEETING_SOCKET_EVENTS.participants, onParticipants);
    socket.on(MEETING_SOCKET_EVENTS.webrtcOffer, onOffer);
    socket.on(MEETING_SOCKET_EVENTS.webrtcAnswer, onAnswer);
    socket.on(MEETING_SOCKET_EVENTS.webrtcIce, onIce);
    socket.on(MEETING_SOCKET_EVENTS.mediaState, onMediaState);
    socket.on(MEETING_SOCKET_EVENTS.error, onError);
    socket.on("disconnect", onDisconnect);
    socket.on("connect", onConnect);

    void joinMeetingRoom();

    const pingInterval = setInterval(() => {
      if (socket.connected) socket.emit(MEETING_SOCKET_EVENTS.ping);
    }, 25_000);

    return () => {
      clearInterval(pingInterval);
      socket.off(MEETING_SOCKET_EVENTS.joined, onJoined);
      socket.off(MEETING_SOCKET_EVENTS.userJoined, onUserJoined);
      socket.off(MEETING_SOCKET_EVENTS.userLeft, onUserLeft);
      socket.off(MEETING_SOCKET_EVENTS.participants, onParticipants);
      socket.off(MEETING_SOCKET_EVENTS.webrtcOffer, onOffer);
      socket.off(MEETING_SOCKET_EVENTS.webrtcAnswer, onAnswer);
      socket.off(MEETING_SOCKET_EVENTS.webrtcIce, onIce);
      socket.off(MEETING_SOCKET_EVENTS.mediaState, onMediaState);
      socket.off(MEETING_SOCKET_EVENTS.error, onError);
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onConnect);

      socket.emit(MEETING_SOCKET_EVENTS.leave);
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
      localStreamRef.current = null;
      joinedRef.current = false;
      screenSharingRef.current = false;
    };
  }, [
    enabled,
    meetingToken,
    userId,
    joinMeetingRoom,
    makeOffer,
    createPeerConnection,
    updateRemote,
    removeRemote,
  ]);

  const toggleAudio = useCallback(() => {
    const camera = cameraStreamRef.current;
    if (!camera) return;
    const next = !audioEnabled;
    camera.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    setAudioEnabled(next);
    emitMediaState({
      audioEnabled: next,
      videoEnabled,
      screenSharing: screenSharingRef.current,
    });
  }, [audioEnabled, videoEnabled, emitMediaState]);

  const toggleVideo = useCallback(() => {
    const next = !videoEnabled;
    if (screenSharingRef.current) {
      screenStreamRef.current?.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
    } else {
      cameraStreamRef.current?.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
    }
    setVideoEnabled(next);
    emitMediaState({
      audioEnabled,
      videoEnabled: next,
      screenSharing: screenSharingRef.current,
    });
  }, [audioEnabled, videoEnabled, emitMediaState]);

  const leaveMeeting = useCallback(() => {
    getMeetingsSocket().emit(MEETING_SOCKET_EVENTS.leave);
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteParticipants(new Map());
    joinedRef.current = false;
    screenSharingRef.current = false;
    setScreenSharing(false);
    setConnectionState("idle");
  }, []);

  return {
    localStream,
    remoteParticipants: Array.from(remoteParticipants.values()),
    audioEnabled,
    videoEnabled,
    screenSharing,
    connectionState,
    error,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveMeeting,
  };
}
