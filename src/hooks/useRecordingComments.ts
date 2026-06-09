import { useCallback, useEffect, useState } from "react";
import { commentsApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export type CommentAuthor = {
  id: number;
  user_name?: string;
  email?: string;
  avatar_url?: string;
};

export type CommentNode = {
  id: number;
  recordingId: number;
  workspaceId: number;
  userId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: CommentAuthor;
  replies: CommentNode[];
};

type FlatComment = Omit<CommentNode, "replies">;

function buildTreeFromFlat(flat: FlatComment[]): CommentNode[] {
  const nodes = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  for (const row of flat) {
    nodes.set(row.id, { ...row, replies: [] });
  }
  for (const row of flat) {
    const node = nodes.get(row.id)!;
    if (row.parentId && nodes.has(row.parentId)) {
      nodes.get(row.parentId)!.replies.push(node);
    } else if (!row.parentId) {
      roots.push(node);
    }
  }

  const sortNodes = (list: CommentNode[]) => {
    list.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    list.forEach((n) => sortNodes(n.replies));
  };
  sortNodes(roots);
  return roots;
}

function flattenTree(nodes: CommentNode[]): FlatComment[] {
  const out: FlatComment[] = [];
  const walk = (list: CommentNode[]) => {
    for (const n of list) {
      const { replies, ...rest } = n;
      out.push(rest);
      walk(replies);
    }
  };
  walk(nodes);
  return out;
}

function insertComment(tree: CommentNode[], comment: FlatComment): CommentNode[] {
  const flat = flattenTree(tree);
  if (flat.some((c) => c.id === comment.id)) return tree;
  flat.push(comment);
  return buildTreeFromFlat(flat);
}

function removeComment(tree: CommentNode[], commentId: number): CommentNode[] {
  const flat = flattenTree(tree).filter((c) => c.id !== commentId);
  return buildTreeFromFlat(flat);
}

export function useRecordingComments(recordingId: number, enabled: boolean) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!recordingId) return;
    setLoading(true);
    try {
      const res = await commentsApi.list(recordingId);
      setComments(res.comments || res.data?.comments || []);
    } finally {
      setLoading(false);
    }
  }, [recordingId]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled || !recordingId) return;
    const socket = getSocket();

    const onCreated = (payload: {
      recordingId: number;
      comment: FlatComment;
    }) => {
      if (payload.recordingId !== recordingId) return;
      setComments((prev) => insertComment(prev, payload.comment));
    };

    const onReplied = (payload: {
      recordingId: number;
      comment: FlatComment;
    }) => {
      if (payload.recordingId !== recordingId) return;
      setComments((prev) => insertComment(prev, payload.comment));
    };

    const onDeleted = (payload: {
      recordingId: number;
      commentId: number;
    }) => {
      if (payload.recordingId !== recordingId) return;
      setComments((prev) => removeComment(prev, payload.commentId));
    };

    socket.on("comment_created", onCreated);
    socket.on("comment_replied", onReplied);
    socket.on("comment_deleted", onDeleted);

    return () => {
      socket.off("comment_created", onCreated);
      socket.off("comment_replied", onReplied);
      socket.off("comment_deleted", onDeleted);
    };
  }, [enabled, recordingId]);

  const addComment = useCallback(
    async (content: string) => {
      setSubmitting(true);
      try {
        const res = await commentsApi.create(recordingId, content);
        const comment = res.comment || res.data?.comment;
        if (comment) {
          setComments((prev) => insertComment(prev, comment));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [recordingId],
  );

  const replyTo = useCallback(
    async (commentId: number, content: string) => {
      setSubmitting(true);
      try {
        const res = await commentsApi.reply(commentId, content);
        const comment = res.comment || res.data?.comment;
        if (comment) {
          setComments((prev) => insertComment(prev, comment));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const deleteComment = useCallback(async (commentId: number) => {
    await commentsApi.delete(commentId);
    setComments((prev) => removeComment(prev, commentId));
  }, []);

  return {
    comments,
    loading,
    submitting,
    addComment,
    replyTo,
    deleteComment,
    reload: load,
  };
}
