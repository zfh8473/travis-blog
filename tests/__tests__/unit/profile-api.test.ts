/**
 * Unit tests for profile API endpoints.
 * 
 * Tests the profile API routes in app/api/profile/route.ts
 * including GET /api/profile and PUT /api/profile.
 * 
 * Note: These tests mock Prisma and NextAuth dependencies.
 */

import { GET, PUT } from "@/app/api/profile/route";
import { prisma } from "@/lib/db/prisma";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAuth } from "@/lib/auth/permissions";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: class NextRequest {
    constructor(public url: string, public init?: any) {}
    async json() {
      return this.init?.body ? JSON.parse(this.init.body) : {};
    }
  },
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(body),
    })),
  },
}));

// Mock dependencies
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth/middleware", () => ({
  getUserFromHeaders: jest.fn(),
}));

jest.mock("@/lib/auth/permissions", () => ({
  requireAuth: jest.fn(),
}));

describe("Profile API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/profile", () => {
    it("should return user profile for authenticated user", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        image: "uploads/avatar.jpg",
        bio: "Test bio",
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      });
      (requireAuth as jest.Mock).mockReturnValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/profile");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          bio: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it("should return 401 for unauthenticated user", async () => {
      (getUserFromHeaders as jest.Mock).mockReturnValue(null);
      (requireAuth as jest.Mock).mockReturnValue({
        status: 401,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: { message: "Authentication required", code: "UNAUTHORIZED" },
        }),
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/profile");
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return 404 if user not found", async () => {
      (getUserFromHeaders as jest.Mock).mockReturnValue({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      });
      (requireAuth as jest.Mock).mockReturnValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/profile");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("PUT /api/profile", () => {
    it("should update user profile for authenticated user", async () => {
      const mockUpdatedUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Updated Name",
        image: "uploads/avatar.jpg",
        bio: "Updated bio",
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      });
      (requireAuth as jest.Mock).mockReturnValue(null);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: "Updated Name",
          bio: "Updated bio",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Updated Name");
      expect(data.data.bio).toBe("Updated bio");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          name: "Updated Name",
          bio: "Updated bio",
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          bio: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it("should return 400 for invalid input", async () => {
      (getUserFromHeaders as jest.Mock).mockReturnValue({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      });
      (requireAuth as jest.Mock).mockReturnValue(null);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: "a".repeat(101), // Too long
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should return 401 for unauthenticated user", async () => {
      (getUserFromHeaders as jest.Mock).mockReturnValue(null);
      (requireAuth as jest.Mock).mockReturnValue({
        status: 401,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: { message: "Authentication required", code: "UNAUTHORIZED" },
        }),
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/profile", {
        method: "PUT",
        body: JSON.stringify({ name: "Test" }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(401);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle empty strings as null (clear fields)", async () => {
      const mockUpdatedUser = {
        id: "user-123",
        email: "test@example.com",
        name: null,
        image: "uploads/avatar.jpg",
        bio: null,
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      });
      (requireAuth as jest.Mock).mockReturnValue(null);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: "",
          bio: "",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.name).toBeNull();
      expect(data.data.bio).toBeNull();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          name: null,
          bio: null,
        },
        select: expect.any(Object),
      });
    });
  });
});

