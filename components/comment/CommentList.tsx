import { Suspense } from "react";
import { Session } from "next-auth";
import { getCommentsAction, Comment } from "@/lib/actions/comment";
import CommentItem from "./CommentItem";

/**
 * Comment list component.
 * 
 * Server Component that fetches and displays all comments for an article.
 * Comments are sorted by creation time (newest first).
 * Supports nested replies display with proper indentation and visual distinction.
 * 
 * @component
 * @param props - Component props
 * @param props.articleId - The ID of the article to fetch comments for
 * @param props.session - Session information from server (optional for backward compatibility)
 * 
 * @example
 * ```tsx
 * <CommentList articleId="article-123" session={session} />
 * ```
 */
export default async function CommentList({
  articleId,
  session,
}: {
  articleId: string;
  session?: Session | null;
}) {
  // Fetch comments with error handling
  let comments: Comment[] = [];
  try {
    comments = await getCommentsAction(articleId);
  } catch (error) {
    // Log error and show empty state
    console.error("Error fetching comments:", error);
    return (
      <div className="text-center py-8 text-red-500">
        <p>加载留言时发生错误，请稍后重试。</p>
      </div>
    );
  }

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
          session={session}
        />
      ))}
    </div>
  );
}

/**
 * Loading component for comment list.
 */
export function CommentListLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-b border-gray-200 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

