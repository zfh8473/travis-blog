import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { getUserFromHeaders } from "./middleware";

/**
 * User role enumeration values.
 * Matches Prisma Role enum: USER, ADMIN
 */
export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type RoleType = typeof Role[keyof typeof Role];

/**
 * User information extracted from request context.
 * Used for permission checks in API routes and Server Components.
 */
export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Checks if a user has a specific role.
 * 
 * @param user - User information object
 * @param requiredRole - Required role (USER or ADMIN)
 * @returns true if user has the required role, false otherwise
 * 
 * @example
 * ```typescript
 * const user = getUserFromHeaders(request.headers);
 * if (user && hasRole(user, Role.ADMIN)) {
 *   // User is admin
 * }
 * ```
 */
export function hasRole(user: UserInfo | null, requiredRole: RoleType): boolean {
  if (!user) {
    return false;
  }
  return user.role === requiredRole;
}

/**
 * Checks if a user is authenticated.
 * 
 * @param user - User information object (from headers or session)
 * @returns true if user is authenticated, false otherwise
 * 
 * @example
 * ```typescript
 * const user = getUserFromHeaders(request.headers);
 * if (!isAuthenticated(user)) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * ```
 */
export function isAuthenticated(user: UserInfo | null): boolean {
  return user !== null;
}

/**
 * Requires authentication for API routes.
 * Returns 401 Unauthorized if user is not authenticated.
 * 
 * @param user - User information from request headers
 * @returns NextResponse with 401 error if not authenticated, null if authenticated
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const user = getUserFromHeaders(request.headers);
 *   const authError = requireAuth(user);
 *   if (authError) return authError;
 *   
 *   // User is authenticated, proceed with request
 * }
 * ```
 */
export function requireAuth(user: UserInfo | null): NextResponse | null {
  if (!isAuthenticated(user)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Authentication required",
          code: "UNAUTHORIZED",
        },
      },
      { status: 401 }
    );
  }
  return null;
}

/**
 * Requires admin role for API routes.
 * Returns 401 Unauthorized if user is not authenticated.
 * Returns 403 Forbidden if user is authenticated but not admin.
 * 
 * @param user - User information from request headers
 * @returns NextResponse with 401 or 403 error if requirements not met, null if user is admin
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const user = getUserFromHeaders(request.headers);
 *   const adminError = requireAdmin(user);
 *   if (adminError) return adminError;
 *   
 *   // User is admin, proceed with admin operations
 * }
 * ```
 */
export function requireAdmin(user: UserInfo | null): NextResponse | null {
  // First check authentication
  const authError = requireAuth(user);
  if (authError) {
    return authError;
  }

  // Then check admin role
  if (!hasRole(user, Role.ADMIN)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Admin access required",
          code: "FORBIDDEN",
        },
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Gets user session for Server Components.
 * Returns null if user is not authenticated.
 * 
 * Note: This function requires dynamic import to avoid issues in test environments.
 * Use getServerSession from next-auth directly in Server Components instead.
 * 
 * @returns Session object with user information, or null if not authenticated
 * 
 * @example
 * ```typescript
 * import { getServerSession } from "next-auth";
 * import { authOptions } from "@/app/api/auth/[...nextauth]/route";
 * 
 * export default async function AdminPage() {
 *   const session = await getServerSession(authOptions);
 *   if (!session) {
 *     redirect("/login");
 *   }
 *   // Use session.user.role to check permissions
 * }
 * ```
 */

/**
 * Requires admin role for Server Components.
 * Redirects to login if not authenticated.
 * Redirects to home with error if authenticated but not admin.
 * 
 * @param session - Session object from getServerSession
 * @param redirectPath - Path to redirect to if not admin (default: "/")
 * @returns true if user is admin, false if redirect was performed
 * 
 * @example
 * ```typescript
 * export default async function AdminPage() {
 *   const session = await getServerSessionWithRole();
 *   if (!requireAdminInServerComponent(session)) {
 *     return; // Redirect was performed
 *   }
 *   // User is admin, render admin content
 * }
 * ```
 */
export function requireAdminInServerComponent(
  session: Session | null,
  redirectPath: string = "/"
): boolean {
  if (!session || !session.user) {
    // Redirect handled by middleware, but we can also handle here
    return false;
  }

  if (session.user.role !== Role.ADMIN) {
    // User is authenticated but not admin
    // In Server Components, we would redirect or show error
    // This function returns false to indicate redirect needed
    return false;
  }

  return true;
}

