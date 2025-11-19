import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ProfileForm } from "./ProfileForm";

/**
 * Profile page component.
 * 
 * Displays current user's profile information and allows updating
 * profile fields (name, bio, avatar).
 * 
 * Requires authentication - redirects to login if not authenticated.
 * 
 * @see ProfileForm - Client component for profile update form
 */
export default async function ProfilePage() {
  // Get session using NextAuth.js getServerSession
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // Redirect to login if not authenticated
    redirect("/login?callbackUrl=/profile");
  }

  // Fetch current profile data from API
  // Note: We could also fetch directly from database here,
  // but using API ensures consistency and includes latest data
  let profileData = null;
  try {
    // In Server Component, we can't use fetch with cookies directly
    // So we'll fetch from database here
    const { prisma } = await import("@/lib/db/prisma");
    profileData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        bio: true,
        role: true,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
  }

  const isAdmin = profileData?.role === "ADMIN";

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl relative z-10">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Card - 移动端优化 */}
        <div className="bg-white dark:bg-gray-800/95 backdrop-blur-sm border border-slate-200/80 dark:border-gray-700/80 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm article-card-hover">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-gray-100">个人设置</h1>
        </div>

        {/* Admin Access Card - Only for admins - 移动端优化布局 */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800/95 backdrop-blur-sm border border-slate-200/80 dark:border-gray-700/80 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm article-card-hover">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">管理后台</h2>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  访问文章管理、媒体管理等管理功能
                </p>
              </div>
              <a
                href="/admin"
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all btn-hover min-h-[44px] flex items-center justify-center flex-shrink-0"
              >
                进入管理后台
              </a>
            </div>
          </div>
        )}

        {/* Profile Form Card - 移动端优化 */}
        <div className="bg-white dark:bg-gray-800/95 backdrop-blur-sm border border-slate-200/80 dark:border-gray-700/80 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm article-card-hover">
          <ProfileForm initialData={profileData} />
        </div>
      </div>
    </div>
  );
}

