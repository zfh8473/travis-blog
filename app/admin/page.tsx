import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";

/**
 * Protected admin page.
 * 
 * Demonstrates how to protect pages using NextAuth.js getServerSession.
 * Middleware handles authentication and role checks, but we also verify here for additional security.
 * 
 * @see middleware.ts - Middleware redirects unauthenticated users to login and blocks non-admin users
 */
export default async function AdminPage() {
  // Get session using NextAuth.js getServerSession
  // This works in Server Components and verifies the JWT token
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // This should not happen if middleware is working correctly,
    // but we add this check as a safety measure
    redirect("/login?callbackUrl=/admin");
  }

  // Check if user has admin role
  if (session.user.role !== Role.ADMIN) {
    // User is authenticated but not admin - redirect to home with error
    redirect("/?error=admin_required");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {session.user.name || session.user.email}!</h2>
        <div className="space-y-2">
          <p>
            <strong>User ID:</strong> {session.user.id}
          </p>
          <p>
            <strong>Email:</strong> {session.user.email}
          </p>
          <p>
            <strong>Role:</strong> {session.user.role}
          </p>
        </div>
        <p className="mt-4 text-gray-600">
          This is a protected admin page. Only users with ADMIN role can access it.
        </p>
      </div>
    </div>
  );
}

