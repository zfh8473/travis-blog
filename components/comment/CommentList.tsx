"use client";

import { Comment } from "./CommentsSection";
import CommentItem from "./CommentItem";

/**
 * Comment list component props.
 */
interface CommentListProps {
  comments: Comment[];
  articleId: string;
  onCommentDeleted?: () => void;
}

/**
 * Comment list component.
 * 
 * Client Component that displays all comments for an article.
 * Supports nested replies display with proper indentation.
 * 
 * @component
 * @param props - Component props
 * @param props.comments - Array of top-level comments (with nested replies)
 * @param props.articleId - The ID of the article
 * @param props.onCommentDeleted - Callback when a comment is deleted
 * 
 * @example
 * ```tsx
 * <CommentList comments={comments} articleId="article-123" />
 * ```
 */
export default function CommentList({
  comments,
  articleId,
  onCommentDeleted,
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>还没有留言，快来发表第一条留言吧！</p>
      </div>
    );
  }

  // Flatten all comments for depth calculation
  const flattenComments = (comments: Comment[]): Comment[] => {
    const result: Comment[] = [];
    const traverse = (comment: Comment) => {
      result.push(comment);
      if (comment.replies) {
        comment.replies.forEach(traverse);
      }
    };
    comments.forEach(traverse);
    return result;
  };

  const allComments = flattenComments(comments);

  return (
    <div className="space-y-0">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          depth={0}
          allComments={allComments}
          articleId={articleId}
          onCommentDeleted={onCommentDeleted}
        />
      ))}
    </div>
  );
}
