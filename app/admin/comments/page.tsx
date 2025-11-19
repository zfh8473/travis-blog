import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import UnreadCommentsList from "@/components/admin/UnreadCommentsList";

/**
 * Admin comments management page.
 * 
 * Displays unread comments for admin users to review and manage.
 * 
 * @component
 * @route /admin/comments
 * @requires Authentication (ADMIN role)
 */
export default async function AdminCommentsPage() {
  // Check authentication and admin role
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/admin/comments");
  }

  if (session.user.role !== Role.ADMIN) {
    redirect("/?error=admin_required");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">评论管理</h1>
      </div>

      {/* Unread Comments List */}
      <UnreadCommentsList />
    </div>
  );
}

