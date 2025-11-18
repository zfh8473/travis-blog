"use client";

import { useEffect, useState, useCallback } from "react";
import { Comment } from "./types";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

interface CommentSectionProps {
  articleId: string;
  slug: string;
}

export default function CommentSection({ articleId, slug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      // Don't set loading true on refresh to avoid flicker
      // setLoading(true); 
      const res = await fetch(`/api/articles/${slug}/comments`);
      if (!res.ok) {
        throw new Error("Failed to load comments");
      }
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      } else {
        throw new Error(data.error?.message || "Failed to load comments");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载评论失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (loading && comments.length === 0) {
    return <div className="py-8 text-center text-gray-500">正在加载评论...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-8" id="comments">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        评论 ({comments.reduce((acc, c) => acc + 1 + (c.replies ? countReplies(c.replies) : 0), 0)})
      </h2>

      <div className="mb-8">
        <CommentForm
          articleId={articleId}
          slug={slug}
          onSuccess={fetchComments}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="space-y-0">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无评论，快来抢沙发吧！
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              slug={slug}
              onRefresh={fetchComments}
            />
          ))
        )}
      </div>
    </div>
  );
}

function countReplies(replies: Comment[]): number {
    let count = 0;
    for (const reply of replies) {
        count += 1;
        if (reply.replies) {
            count += countReplies(reply.replies);
        }
    }
    return count;
}

