import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next.js middleware for JWT authentication.
 * 
 * Protects routes by verifying JWT tokens from NextAuth.js.
 * Extracts token from httpOnly cookie or Authorization header.
 * Attaches user information to request context.
 * Redirects unauthenticated users to login page.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedApiRoutes = ["/api/admin", "/api/articles", "/api/protected", "/api/profile"];
  const protectedPages = ["/admin", "/profile"];

  // Define admin-only routes (require ADMIN role)
  const adminApiRoutes = ["/api/admin"];
  const adminPages = ["/admin"];

  // Check if the route is protected
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedPage = protectedPages.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the route requires admin role
  const isAdminApiRoute = adminApiRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminPage = adminPages.some((route) =>
    pathname.startsWith(route)
  );

  // Skip middleware for non-protected routes and NextAuth.js routes
  // NextAuth.js handles its own authentication
  if (
    (!isProtectedApiRoute && !isProtectedPage) ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  try {
    // Extract and verify JWT token using NextAuth.js getToken
    // This function automatically:
    // - Extracts token from httpOnly cookie (next-auth.session-token)
    // - Verifies token signature using NEXTAUTH_SECRET
    // - Checks token expiration
    // - Returns decoded token with user information
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no valid token, handle authentication failure
    if (!token) {
      if (isProtectedApiRoute) {
        // For API routes, return 401 Unauthorized JSON response
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
      } else {
        // For pages, redirect to login with callbackUrl
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Token is valid - check role-based access control for admin routes
    const userRole = token.role || "";

    // Check if route requires admin role and user is not admin
    if ((isAdminApiRoute || isAdminPage) && userRole !== "ADMIN") {
      // User is authenticated but not admin - return 403 Forbidden
      console.warn("Permission denied: User attempted to access admin route without ADMIN role", {
        pathname,
        userId: token.id,
        userEmail: token.email,
        userRole,
      });

      if (isAdminApiRoute) {
        // For API routes, return 403 Forbidden JSON response
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
      } else {
        // For pages, redirect to home with error message
        const homeUrl = new URL("/", request.url);
        homeUrl.searchParams.set("error", "admin_required");
        return NextResponse.redirect(homeUrl);
      }
    }

    // Token is valid and user has required role - attach user information to request headers
    // This makes user information available in API routes and Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", token.id || "");
    requestHeaders.set("x-user-email", token.email || "");
    requestHeaders.set("x-user-name", token.name || "");
    requestHeaders.set("x-user-role", token.role || "");

    // Create response with modified headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  } catch (error) {
    // Handle token verification errors
    console.error("Middleware authentication error:", error);

    if (isProtectedApiRoute) {
      // For API routes, return 401 Unauthorized JSON response
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Authentication failed",
            code: "AUTH_ERROR",
          },
        },
        { status: 401 }
      );
    } else {
      // For pages, redirect to login with callbackUrl
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
}

/**
 * Middleware matcher configuration.
 * 
 * Specifies which routes the middleware should run on.
 * Only runs on protected routes to optimize performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth/* (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

