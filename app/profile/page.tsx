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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 shadow-sm article-card-hover">
          <h1 className="text-3xl font-bold text-slate-900">个人设置</h1>
        </div>

        {/* Admin Access Card - Only for admins */}
        {isAdmin && (
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 shadow-sm article-card-hover">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">管理后台</h2>
                <p className="text-sm text-slate-600">
                  访问文章管理、媒体管理等管理功能
                </p>
              </div>
              <a
                href="/admin"
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all btn-hover"
              >
                进入管理后台
              </a>
            </div>
          </div>
        )}

        {/* Profile Form Card */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 shadow-sm article-card-hover">
          <ProfileForm initialData={profileData} />
        </div>
      </div>
    </div>
  );
}

