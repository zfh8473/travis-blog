import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import Link from "next/link";
import AdminNavigation from "@/components/admin/AdminNavigation";

/**
 * Admin layout component.
 * 
 * Provides unified admin layout with navigation menu for all admin pages.
 * Implements double-check security: middleware (first layer) + Server Component (second layer).
 * 
 * @param children - Child page content to render in main content area
 * 
 * @see middleware.ts - Middleware provides first layer of protection
 * @see app/admin/page.tsx - Example permission check pattern
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session using NextAuth.js getServerSession
  // This provides second layer of security (middleware is first layer)
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session || !session.user) {
    // Redirect to login with callback URL
    redirect("/login?callbackUrl=/admin");
  }

  // Check if user has admin role
  if (session.user.role !== Role.ADMIN) {
    // User is authenticated but not admin - redirect to home with error
    redirect("/?error=admin_required");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - 移动端优化 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Link 
                href="/admin" 
                className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Travis Blog Admin
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* 移动端：简化用户信息显示 */}
              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                {session.user.name || session.user.email}
              </span>
              <a
                href="/api/auth/signout"
                className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-2 sm:px-0 py-2 sm:py-0 min-h-[44px] sm:min-h-0 flex items-center justify-center transition-colors"
              >
                退出
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation - 移动端优化 */}
        <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 md:min-h-[calc(100vh-3.5rem)] md:sticky md:top-14">
          <AdminNavigation />
        </aside>

        {/* Main Content - 移动端优化 */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

