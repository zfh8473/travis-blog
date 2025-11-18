"use client";

import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import CommentForm from "./CommentForm";

/**
 * Comment form wrapper component props.
 */
interface CommentFormWrapperProps {
  articleId: string;
  session: Session | null;
}

/**
 * Comment form wrapper component.
 * 
 * Client Component that wraps the CommentForm and handles:
 * - Session information passing (from server to client)
 * - Page refresh after successful comment creation
 * 
 * This component avoids using useSession hook in CommentForm,
 * instead receiving session from the server component.
 * 
 * @component
 * @param props - Component props
 * @param props.articleId - The ID of the article to comment on
 * @param props.session - Session information from server (null if not logged in)
 * 
 * @example
 * ```tsx
 * <CommentFormWrapper 
 *   articleId="article-123"
 *   session={session}
 * />
 * ```
 */
export default function CommentFormWrapper({
  articleId,
  session,
}: CommentFormWrapperProps) {
  const router = useRouter();

  /**
   * Handles successful comment creation.
   * Refreshes the server components to show the new comment.
   */
  const handleSuccess = () => {
    // Use router.refresh() to refresh server components
    // This is more efficient than window.location.reload()
    router.refresh();
  };

  return (
    <CommentForm
      articleId={articleId}
      session={session}
      onSuccess={handleSuccess}
    />
  );
}

