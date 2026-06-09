import { useCallback, useEffect, useState } from "react";
import {
  connectMeetingsSocket,
  getMeetingsSocket,
  MEETING_SOCKET_EVENTS,
} from "@/lib/meetingsSocket";
import { meetingsApi } from "@/lib/api";

export type MeetingChatMessage = {
  id: number;
  meetingId: number;
  workspaceId: number;
  userId: number;
  message: string;
  timestamp: string;
  author?: {
    id: number;
    user_name?: string;
    email?: string;
    avatar_url?: string;
  };
};

export function useMeetingChat(meetingId: number, enabled: boolean) {
  const [messages, setMessages] = useState<MeetingChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await meetingsApi.getChat(meetingId);
      const rows = res.data || res.rows || res.messages || [];
      setMessages(
        rows.map((row: Record<string, unknown>) => ({
          id: row.id as number,
          meetingId: row.meetingId as number,
          workspaceId: row.workspaceId as number,
          userId: row.userId as number,
          message: row.message as string,
          timestamp: String(row.timestamp || row.createdAt),
          author: (row.author || row.user) as MeetingChatMessage["author"],
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    if (!enabled) return;
    void loadHistory();
  }, [enabled, loadHistory]);

  useEffect(() => {
    if (!enabled) return;
    connectMeetingsSocket();
    const socket = getMeetingsSocket();

    const onMessage = (msg: MeetingChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on(MEETING_SOCKET_EVENTS.chatMessage, onMessage);
    return () => {
      socket.off(MEETING_SOCKET_EVENTS.chatMessage, onMessage);
    };
  }, [enabled]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    getMeetingsSocket().emit(MEETING_SOCKET_EVENTS.chatSend, {
      message: trimmed,
    });
  }, []);

  return { messages, loading, sendMessage };
}
