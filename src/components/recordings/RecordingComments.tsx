import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Reply, Trash2 } from "lucide-react";
import { useRecordingComments, type CommentNode } from "@/hooks/useRecordingComments";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type CommentItemProps = {
  comment: CommentNode;
  depth?: number;
  currentUserId?: number;
  onReply: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  submitting: boolean;
};

function CommentItem({
  comment,
  depth = 0,
  currentUserId,
  onReply,
  onDelete,
  submitting,
}: CommentItemProps) {
  const { t } = useTranslation(["recording", "common"]);
  const confirm = useConfirmDialog();
  const { toast } = useToast();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const authorName =
    comment.author?.user_name || comment.author?.email || `User ${comment.userId}`;
  const isOwn = currentUserId === comment.userId;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await onReply(comment.id, replyText);
      setReplyText("");
      setReplyOpen(false);
    } catch (err) {
      toast({
        title: t("common:error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: t("recording:comments.deleteTitle"),
      description: t("recording:comments.deleteDesc"),
      confirmText: t("common:actions.delete"),
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (err) {
      toast({
        title: t("common:error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={cn(depth > 0 && "ml-6 border-l border-border pl-4")}>
      <div className="rounded-lg bg-muted/50 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{authorName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={() => setReplyOpen((v) => !v)}
            >
              <Reply className="h-3 w-3" />
              {t("recording:comments.reply")}
            </Button>
            {isOwn && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm">{comment.content}</p>
      </div>

      {replyOpen && (
        <div className="mt-2 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t("recording:comments.replyPlaceholder")}
            rows={2}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => void handleReply()}
              disabled={submitting || !replyText.trim()}
            >
              {submitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {t("recording:comments.postReply")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setReplyOpen(false);
                setReplyText("");
              }}
            >
              {t("common:actions.cancel")}
            </Button>
          </div>
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type RecordingCommentsProps = {
  recordingId: number;
};

export default function RecordingComments({ recordingId }: RecordingCommentsProps) {
  const { t } = useTranslation(["recording", "common"]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { comments, loading, submitting, addComment, replyTo, deleteComment } =
    useRecordingComments(recordingId, Boolean(recordingId));
  const [draft, setDraft] = useState("");

  const handleAdd = async () => {
    if (!draft.trim()) return;
    try {
      await addComment(draft);
      setDraft("");
    } catch (err) {
      toast({
        title: t("common:error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          {t("recording:comments.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("recording:comments.placeholder")}
            rows={3}
            className="resize-none"
          />
          <Button
            onClick={() => void handleAdd()}
            disabled={submitting || !draft.trim()}
            className="gradient-primary"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("recording:comments.post")}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("recording:comments.empty")}
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={Number(user?.id)}
                onReply={replyTo}
                onDelete={deleteComment}
                submitting={submitting}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
