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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                Travis Blog Admin
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.name || session.user.email}
              </span>
              <a
                href="/api/auth/signout"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                退出登录
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <AdminNavigation />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

