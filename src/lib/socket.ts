import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

let socket: Socket | null = null;
const toBearerToken = (token: string | null) => (token ? `Bearer ${token}` : "");
let lastAuthToken = "";

export function getSocket(): Socket {
  if (!socket) {
    const token = getAccessToken();
    lastAuthToken = toBearerToken(token);
    socket = io(BASE_URL, {
      auth: { token: lastAuthToken },
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });
    socket.on("connect", () => {
      console.info("Socket connected:", socket?.id);
    });
    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err?.message || err);
    });
  }
  return socket;
}

export function connectSocket() {
  const token = getAccessToken();
  if (!token) return;
  const s = getSocket();
  const bearer = toBearerToken(token);
  const authChanged = bearer !== lastAuthToken;
  s.auth = { token: bearer };
  lastAuthToken = bearer;

  if (authChanged && (s.connected || s.active)) {
    s.disconnect();
  }
  if (!s.connected) s.connect();
}

/** Call after access token changes so the server handshake uses the new JWT. */
export function reconnectSocketWithLatestToken() {
  const token = getAccessToken();
  if (!token) return;
  const s = getSocket();
  const bearer = toBearerToken(token);
  s.auth = { token: bearer };
  lastAuthToken = bearer;
  if (s.connected) s.disconnect();
  s.connect();
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastAuthToken = "";
  }
}

// Socket event types
export type RecordingEvent =
  | "upload_completed"
  | "processing_initiated"
  | "video_ready"
  | "video_deleted"
  | "processing_failed";

export type PlanEvent = "limit_warning";

export type WorkspaceEvent =
  | "new_member"
  | "storage_limit"
  | "invitation_accepted"
  | "invitation_expired"
  | "member_removed"
  | "member_role_updated";
