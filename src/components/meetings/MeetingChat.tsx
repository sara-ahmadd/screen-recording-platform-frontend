import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import type { MeetingChatMessage } from "@/hooks/useMeetingChat";
import { cn } from "@/lib/utils";

type MeetingChatProps = {
  messages: MeetingChatMessage[];
  loading: boolean;
  currentUserId?: number;
  onSend: (message: string) => void;
  className?: string;
};

export default function MeetingChat({
  messages,
  loading,
  currentUserId,
  onSend,
  className,
}: MeetingChatProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <div className={cn("flex h-full flex-col rounded-lg border bg-card", className)}>
      <div className="border-b px-4 py-3 font-medium">Chat</div>
      <ScrollArea className="flex-1 px-4 py-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const author = msg.author || (msg as { user?: MeetingChatMessage["author"] }).user;
              const name = author?.user_name || author?.email || `User ${msg.userId}`;
              const isSelf = currentUserId === msg.userId;
              return (
                <div key={msg.id} className={cn("text-sm", isSelf && "text-right")}>
                  <div className="text-xs text-muted-foreground">
                    {name} · {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 inline-block rounded-lg px-3 py-1.5",
                      isSelf ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
      <div className="flex gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button size="icon" onClick={handleSend} disabled={!draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
