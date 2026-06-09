import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

let meetingsSocket: Socket | null = null;
let lastAuthToken = "";

const toBearerToken = (token: string | null) => (token ? `Bearer ${token}` : "");

export const MEETING_SOCKET_EVENTS = {
  join: "meeting:join",
  joined: "meeting:joined",
  leave: "meeting:leave",
  ping: "meeting:ping",
  pong: "meeting:pong",
  userJoined: "meeting:user-joined",
  userLeft: "meeting:user-left",
  participants: "meeting:participants",
  mediaState: "meeting:media-state",
  webrtcOffer: "webrtc:offer",
  webrtcAnswer: "webrtc:answer",
  webrtcIce: "webrtc:ice-candidate",
  chatSend: "meeting:chat:send",
  chatMessage: "meeting:chat:message",
  error: "meeting:error",
} as const;

export function getMeetingsSocket(): Socket {
  if (!meetingsSocket) {
    const token = getAccessToken();
    lastAuthToken = toBearerToken(token);
    meetingsSocket = io(`${BASE_URL}/meetings-socket`, {
      auth: { token: lastAuthToken },
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });
  }
  return meetingsSocket;
}

export function connectMeetingsSocket() {
  const token = getAccessToken();
  if (!token) return;
  const s = getMeetingsSocket();
  const bearer = toBearerToken(token);
  if (s.connected && bearer === lastAuthToken) return;

  const authChanged = bearer !== lastAuthToken;
  s.auth = { token: bearer };
  lastAuthToken = bearer;

  if (authChanged && (s.connected || s.active)) {
    s.disconnect();
  }
  if (!s.connected) s.connect();
}

export function disconnectMeetingsSocket() {
  if (meetingsSocket) {
    meetingsSocket.disconnect();
    meetingsSocket = null;
    lastAuthToken = "";
  }
}
