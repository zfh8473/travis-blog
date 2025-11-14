/**
 * Integration tests for image upload API endpoint.
 * 
 * Tests the POST /api/upload endpoint including authentication,
 * authorization, file validation, and storage integration.
 */

import { POST } from "@/app/api/upload/route";
import { prisma } from "@/lib/db/prisma";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { getStorage } from "@/lib/storage";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: class NextRequest {
    constructor(public url: string, public init?: any) {}
    async formData() {
      return this.init?.formData || new FormData();
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
  prisma: {},
}));

jest.mock("@/lib/auth/middleware", () => ({
  getUserFromHeaders: jest.fn(),
}));

jest.mock("@/lib/auth/permissions", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/storage", () => ({
  getStorage: jest.fn(),
}));

describe("Upload API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/upload", () => {
    it("should upload valid image file for admin user", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      const mockFile = new File(["test image content"], "test.jpg", {
        type: "image/jpeg",
      });

      const mockStorage = {
        upload: jest.fn().mockResolvedValue("uploads/test-123.jpg"),
        getUrl: jest.fn().mockResolvedValue("/uploads/test-123.jpg"),
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);
      (getStorage as jest.Mock).mockReturnValue(mockStorage);

      const formData = new FormData();
      formData.append("file", mockFile);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        formData: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.url).toBe("/uploads/test-123.jpg");
      expect(data.data.path).toBe("uploads/test-123.jpg");
      // Verify upload was called (file object may be different due to FormData)
      expect(mockStorage.upload).toHaveBeenCalled();
    });

    it("should return 401 for unauthenticated user", async () => {
      (getUserFromHeaders as jest.Mock).mockReturnValue(null);
      (requireAdmin as jest.Mock).mockReturnValue({
        status: 401,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: { message: "Authentication required", code: "UNAUTHORIZED" },
        }),
      });

      const formData = new FormData();
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      formData.append("file", mockFile);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        formData: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(getStorage).not.toHaveBeenCalled();
    });

    it("should return 403 for non-admin user", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        name: "Regular User",
        role: "USER",
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue({
        status: 403,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: { message: "Admin access required", code: "FORBIDDEN" },
        }),
      });

      const formData = new FormData();
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      formData.append("file", mockFile);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        formData: formData,
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(getStorage).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid file type", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      const mockFile = new File(["test"], "test.txt", {
        type: "text/plain",
      });

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);

      const formData = new FormData();
      formData.append("file", mockFile);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        formData: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_FILE_TYPE");
    });

    it("should return 413 for file too large", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      // Create a file larger than 5MB
      const largeContent = new Array(6 * 1024 * 1024).fill("a").join("");
      const mockFile = new File([largeContent], "large.jpg", {
        type: "image/jpeg",
      });

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);

      const formData = new FormData();
      formData.append("file", mockFile);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        formData: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FILE_TOO_LARGE");
    });

    it("should return 400 when no file is provided", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);

      const formData = new FormData();

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        formData: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("MISSING_FILE");
    });
  });
});

