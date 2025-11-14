/**
 * Unit tests for permission check functions.
 * 
 * Tests the permission check functions in lib/auth/permissions.ts
 * including requireAuth, requireAdmin, hasRole, and isAuthenticated.
 */

import {
  requireAuth,
  requireAdmin,
  hasRole,
  isAuthenticated,
  Role,
  type UserInfo,
} from "@/lib/auth/permissions";

describe("Permission Check Functions", () => {
  describe("isAuthenticated", () => {
    it("should return true for authenticated user", () => {
      const user: UserInfo = {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: Role.USER,
      };
      expect(isAuthenticated(user)).toBe(true);
    });

    it("should return false for null user", () => {
      expect(isAuthenticated(null)).toBe(false);
    });
  });

  describe("hasRole", () => {
    it("should return true if user has required role", () => {
      const user: UserInfo = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: Role.ADMIN,
      };
      expect(hasRole(user, Role.ADMIN)).toBe(true);
    });

    it("should return false if user does not have required role", () => {
      const user: UserInfo = {
        id: "user-123",
        email: "user@example.com",
        name: "Regular User",
        role: Role.USER,
      };
      expect(hasRole(user, Role.ADMIN)).toBe(false);
    });

    it("should return false for null user", () => {
      expect(hasRole(null, Role.ADMIN)).toBe(false);
    });
  });

  describe("requireAuth", () => {
    it("should return null for authenticated user", () => {
      const user: UserInfo = {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: Role.USER,
      };
      const result = requireAuth(user);
      expect(result).toBeNull();
    });

    it("should return 401 Unauthorized for unauthenticated user", () => {
      const result = requireAuth(null);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(401);
      
      // Verify response body structure
      // Note: We can't easily test the JSON body without mocking NextResponse
      // The important part is that it returns a non-null response with 401 status
    });
  });

  describe("requireAdmin", () => {
    it("should return null for admin user", () => {
      const user: UserInfo = {
        id: "admin-123",
        email: "admin@example.com",
        name: "Admin User",
        role: Role.ADMIN,
      };
      const result = requireAdmin(user);
      expect(result).toBeNull();
    });

    it("should return 401 Unauthorized for unauthenticated user", () => {
      const result = requireAdmin(null);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(401);
      
      // Verify response body structure
      // Note: We can't easily test the JSON body without mocking NextResponse
      // The important part is that it returns a non-null response with 401 status
    });

    it("should return 403 Forbidden for non-admin user", () => {
      const user: UserInfo = {
        id: "user-123",
        email: "user@example.com",
        name: "Regular User",
        role: Role.USER,
      };
      const result = requireAdmin(user);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
      
      // Verify response body structure
      // Note: We can't easily test the JSON body without mocking NextResponse
      // The important part is that it returns a non-null response with 403 status
    });
  });
});

