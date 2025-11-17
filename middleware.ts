import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * API protection rule definition.
 */
interface ApiProtectionRule {
  prefix: string;
  requiresAdmin?: boolean;
  methods?: string[];
  excludePrefixes?: string[];
}

/**
 * API protection rules.
 * 
 * Each rule defines which API prefixes require authentication and/or admin role.
 * Pages are protected by their respective layouts/server components, so middleware
 * now only targets API routes.
 */
const apiProtectionRules: ApiProtectionRule[] = [
  { prefix: "/api/admin", requiresAdmin: true },
  {
    prefix: "/api/articles",
    requiresAdmin: true,
    excludePrefixes: ["/api/articles/public"],
  },
  { prefix: "/api/profile", requiresAdmin: false },
  { prefix: "/api/protected", requiresAdmin: false },
  // Note: /api/upload is handled in the API route itself, not in middleware
  // This avoids Edge Runtime limitations with getToken
  // { prefix: "/api/upload", requiresAdmin: true },
  { prefix: "/api/media", requiresAdmin: true },
  {
    prefix: "/api/tags",
    requiresAdmin: true,
    methods: ["POST", "PUT", "PATCH", "DELETE"],
  },
];

/**
 * Finds the protection rule for the current request, if any.
 */
function getMatchingRule(pathname: string, method: string) {
  for (const rule of apiProtectionRules) {
    if (!pathname.startsWith(rule.prefix)) {
      continue;
    }

    if (rule.excludePrefixes?.some((excluded) => pathname.startsWith(excluded))) {
      continue;
    }

    if (rule.methods && !rule.methods.includes(method)) {
      continue;
    }

    return rule;
  }

  return null;
}

/**
 * Next.js middleware for protecting API routes.
 * 
 * Pages are protected within their layouts/server components. This middleware
 * now focuses solely on API endpoints that require authentication.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip NextAuth routes entirely
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const rule = getMatchingRule(pathname, request.method);

  // Non-protected API route
  if (!rule) {
    return NextResponse.next();
  }

  try {
    // Get token from cookie
    // NextAuth automatically uses __Secure- prefix for secure cookies in production
    let token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Debug logging (remove in production if needed)
    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV) {
      console.log("[Middleware] Path:", pathname);
      console.log("[Middleware] Method:", request.method);
      console.log("[Middleware] Token exists (first attempt):", !!token);
      const cookies = request.cookies.getAll();
      console.log("[Middleware] Cookies count:", cookies.length);
      if (cookies.length > 0) {
        console.log("[Middleware] Cookie names:", cookies.map(c => c.name).join(", "));
        // Try to find the session token cookie
        const sessionCookie = cookies.find(c => 
          c.name === "next-auth.session-token" || 
          c.name === "__Secure-next-auth.session-token" ||
          c.name === "__Host-next-auth.session-token"
        );
        if (sessionCookie) {
          console.log("[Middleware] Found session cookie:", sessionCookie.name, "Length:", sessionCookie.value.length);
        } else {
          console.log("[Middleware] Session cookie not found in cookie list");
        }
      }
    }

    // If getToken failed, log more details for debugging
    if (!token) {
      if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV) {
        const sessionCookie = request.cookies.get("next-auth.session-token");
        const secureCookie = request.cookies.get("__Secure-next-auth.session-token");
        const hostCookie = request.cookies.get("__Host-next-auth.session-token");
        
        console.log("[Middleware] Session cookie exists:", !!sessionCookie);
        console.log("[Middleware] Secure cookie exists:", !!secureCookie);
        console.log("[Middleware] Host cookie exists:", !!hostCookie);
        
        if (sessionCookie) {
          console.log("[Middleware] Session cookie length:", sessionCookie.value.length);
          console.log("[Middleware] Session cookie preview:", sessionCookie.value.substring(0, 50) + "...");
        }
        
        console.log("[Middleware] NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);
        console.log("[Middleware] NEXTAUTH_SECRET length:", process.env.NEXTAUTH_SECRET?.length || 0);
      }
    }

    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV) {
      if (token) {
        console.log("[Middleware] User:", token.email, "Role:", token.role);
      } else {
        console.log("[Middleware] All token retrieval attempts failed");
      }
    }

    if (!token) {
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

    const userRole = token.role || "";

    if (rule.requiresAdmin && userRole !== "ADMIN") {
      console.warn("Permission denied: Admin role required", {
        pathname,
        userId: token.id,
        userEmail: token.email,
        userRole,
      });

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

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", token.id || "");
    requestHeaders.set("x-user-email", token.email || "");
    requestHeaders.set("x-user-name", token.name || "");
    requestHeaders.set("x-user-role", token.role || "");

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  } catch (error) {
    console.error("Middleware authentication error:", error);

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
  }
}

/**
 * Middleware matcher configuration.
 * 
 * Restricts middleware execution to API routes.
 */
export const config = {
  matcher: [
    "/api/:path*",
  ],
};

