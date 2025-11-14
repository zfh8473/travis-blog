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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <ProfileForm initialData={profileData} />
      </div>
    </div>
  );
}

