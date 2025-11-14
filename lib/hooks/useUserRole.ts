"use client";

import { useSession } from "next-auth/react";
import { Role } from "@/lib/auth/permissions";

/**
 * Custom hook to check user role in client components.
 * 
 * Uses NextAuth.js useSession hook to get current user session.
 * Provides convenient methods to check user role and authentication status.
 * 
 * @returns Object with user role information and helper methods
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { isAdmin, isAuthenticated, userRole } = useUserRole();
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   if (isAdmin) {
 *     return <AdminPanel />;
 *   }
 *   
 *   return <UserPanel />;
 * }
 * ```
 */
export function useUserRole() {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated" && session !== null;
  const userRole = session?.user?.role || null;
  const isAdmin = userRole === Role.ADMIN;
  const isUser = userRole === Role.USER;

  return {
    session,
    status,
    isAuthenticated,
    userRole,
    isAdmin,
    isUser,
    userId: session?.user?.id || null,
    userEmail: session?.user?.email || null,
    userName: session?.user?.name || null,
  };
}

