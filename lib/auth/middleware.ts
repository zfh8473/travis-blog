import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import type { JWT } from "next-auth/jwt";

/**
 * Extracts user information from JWT token in middleware.
 * 
 * Uses NextAuth.js getToken function to extract and verify JWT token
 * from httpOnly cookie or Authorization header.
 * 
 * @param request - Next.js request object
 * @returns User information from JWT token, or null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getUserFromRequest(request);
 * if (!user) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * ```
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<JWT | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    return token;
  } catch (error) {
    console.error("Error extracting user from request:", error);
    return null;
  }
}

/**
 * Extracts user information from request headers (set by middleware).
 * 
 * Middleware attaches user information to request headers for use in
 * API routes and Server Components.
 * 
 * @param headers - Request headers object
 * @returns User information from headers, or null if not present
 * 
 * @example
 * ```typescript
 * const user = getUserFromHeaders(request.headers);
 * if (!user) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * ```
 */
export function getUserFromHeaders(headers: Headers): {
  id: string;
  email: string;
  name: string | null;
  role: string;
} | null {
  const userId = headers.get("x-user-id");
  const userEmail = headers.get("x-user-email");
  const userName = headers.get("x-user-name");
  const userRole = headers.get("x-user-role");

  if (!userId || !userEmail || !userRole) {
    return null;
  }

  return {
    id: userId,
    email: userEmail,
    name: userName,
    role: userRole,
  };
}

