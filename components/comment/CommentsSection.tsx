import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CommentFormWrapper from "./CommentFormWrapper";
import CommentList, { CommentListLoading } from "./CommentList";

/**
 * Comments section component props.
 */
interface CommentsSectionProps {
  articleId: string;
}

/**
 * Get session with timeout to prevent hanging in Vercel environment.
 * 
 * In Vercel, getServerSession may sometimes hang, causing the page to freeze.
 * This wrapper adds a timeout to prevent blocking the entire page load.
 */
async function getSessionWithTimeout(): Promise<Session | null> {
  try {
    // Use Promise.race to add a timeout
    const timeoutPromise = new Promise<Session | null>((resolve) => {
      setTimeout(() => resolve(null), 2000); // 2 second timeout
    });

    const sessionPromise = getServerSession(authOptions);
    
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    return result;
  } catch (error) {
    // Log error but return null to allow anonymous access
    console.error("Error getting session in CommentsSection:", error);
    return null;
  }
}

/**
 * Comments section component.
 * 
 * Server Component that serves as the container for the comments section.
 * Fetches session information on the server and passes it to client components.
 * 
 * Uses timeout protection to prevent hanging in Vercel environment.
 * 
 * @component
 * @param props - Component props
 * @param props.articleId - The ID of the article to display comments for
 * 
 * @example
 * ```tsx
 * <CommentsSection articleId="article-123" />
 * ```
 */
export default async function CommentsSection({
  articleId,
}: CommentsSectionProps) {
  // Get session on server side with timeout protection
  // This prevents the page from hanging if getServerSession blocks in Vercel
  const session = await getSessionWithTimeout();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl border-t border-gray-200 mt-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">留言</h2>
      
      {/* Comment form wrapper - passes session to client component */}
      <div className="mb-8">
        <CommentFormWrapper articleId={articleId} session={session} />
      </div>
      
      {/* Comments list - server component with suspense */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">所有留言</h3>
        <Suspense fallback={<CommentListLoading />}>
          <CommentList articleId={articleId} session={session} />
        </Suspense>
      </div>
    </div>
  );
}

