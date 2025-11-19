import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import UnreadCommentsBadge from "@/components/admin/UnreadCommentsBadge";
import UnreadCommentsList from "@/components/admin/UnreadCommentsList";

/**
 * Admin dashboard homepage.
 * 
 * Displays welcome message, user information, and quick links to admin sections.
 * Layout is automatically provided by app/admin/layout.tsx.
 * Permission checks are handled by layout component.
 * 
 * @see app/admin/layout.tsx - Admin layout with permission checks
 */
export default async function AdminPage() {
  // Get session - layout already checks permissions, but we need session for user info
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">仪表板</h1>
      
      {/* Welcome Message */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          欢迎, {session?.user?.name || session?.user?.email || "管理员"}!
        </h2>
        <div className="space-y-2 text-gray-600">
          <p>
            <strong>邮箱:</strong> {session?.user?.email}
          </p>
          <p>
            <strong>角色:</strong> {session?.user?.role}
          </p>
        </div>
      </div>

      {/* Unread Comments Section */}
      <div className="mb-6">
        <UnreadCommentsList />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/articles"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">文章管理</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            创建、编辑和管理文章
          </p>
        </Link>
        
        <Link
          href="/admin/media"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">媒体管理</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            管理上传的媒体文件
          </p>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-center justify-center">
          <UnreadCommentsBadge />
        </div>
      </div>
    </div>
  );
}

