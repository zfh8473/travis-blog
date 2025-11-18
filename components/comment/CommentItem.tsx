"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Comment } from "./types";
import CommentForm from "./CommentForm";
import { MAX_COMMENT_DEPTH } from "@/lib/utils/comment-depth";

interface CommentItemProps {
  comment: Comment;
  slug: string;
  depth?: number;
  onRefresh: () => void;
}

export default function CommentItem({
  comment,
  slug,
  depth = 0,
  onRefresh,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isAuthor = session?.user?.id === comment.userId;
  const canDelete = isAdmin || isAuthor;

  const displayName = comment.user?.name || comment.authorName || "匿名用户";
  const avatarUrl = comment.user?.image;

  const handleReplySuccess = () => {
    setIsReplying(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这条评论吗？这将同时删除所有回复。")) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "删除失败");
      }

      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "删除失败";
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`flex gap-4 ${depth > 0 ? "mt-4" : "py-6 border-b border-gray-100"}`}>
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{displayName}</span>
            <span className="text-sm text-gray-500">
              {format(new Date(comment.createdAt), "yyyy年MM月dd日 HH:mm", {
                locale: zhCN,
              })}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-500 hover:text-red-700"
            >
              {isDeleting ? "删除中..." : "删除"}
            </button>
          )}
        </div>

        <div className="text-gray-700 whitespace-pre-wrap mb-2">
          {comment.content}
        </div>

        <div className="flex items-center gap-4">
            {depth < MAX_COMMENT_DEPTH && (
            <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
                回复
            </button>
            )}
        </div>

        {isReplying && (
          <div className="mt-4">
            <CommentForm
              articleId={comment.articleId}
              slug={slug}
              parentId={comment.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setIsReplying(false)}
              placeholder={`回复 @${displayName}...`}
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-gray-100">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                slug={slug}
                depth={depth + 1}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
