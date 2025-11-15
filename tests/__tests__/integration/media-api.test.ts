/**
 * Integration tests for media library API endpoints.
 * 
 * Tests the GET /api/media and DELETE /api/media/[path] endpoints including:
 * - Authentication and authorization
 * - File listing with pagination
 * - File deletion
 * - File usage check
 * - Error handling
 */

import { GET, DELETE } from "@/app/api/media/route";
import { DELETE as DELETE_PATH } from "@/app/api/media/[path]/route";
import { prisma } from "@/lib/db/prisma";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { getStorage } from "@/lib/storage";
import { checkFileUsage } from "@/lib/utils/media";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: class NextRequest {
    constructor(public url: string, public init?: any) {}
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
    article: {
      findMany: jest.fn(),
    },
  },
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

jest.mock("@/lib/utils/media", () => ({
  checkFileUsage: jest.fn(),
}));

describe("Media API Integration Tests", () => {
  const mockUser = {
    id: "user-123",
    email: "admin@example.com",
    name: "Admin User",
    role: "ADMIN",
  };

  const mockFiles = [
    {
      path: "uploads/image1.jpg",
      name: "image1.jpg",
      size: 102400,
      mimeType: "image/jpeg",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      path: "uploads/image2.png",
      name: "image2.png",
      size: 204800,
      mimeType: "image/png",
      createdAt: new Date("2024-01-02T00:00:00Z"),
    },
    {
      path: "uploads/document.pdf",
      name: "document.pdf",
      size: 512000,
      mimeType: "application/pdf",
      createdAt: new Date("2024-01-03T00:00:00Z"),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up common mocks
    (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
    (requireAdmin as jest.Mock).mockReturnValue(null);
  });

  describe("GET /api/media", () => {
    it("should return media file list with pagination for admin user", async () => {
      const mockStorage = {
        list: jest.fn().mockResolvedValue(mockFiles),
        getUrl: jest.fn((path: string) => Promise.resolve(`/${path}`)),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media?page=1&limit=20");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.files).toHaveLength(3);
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
      });
      expect(data.data.files[0]).toHaveProperty("url");
      expect(mockStorage.list).toHaveBeenCalled();
    });

    it("should return paginated results", async () => {
      const manyFiles = Array.from({ length: 25 }, (_, i) => ({
        path: `uploads/file${i + 1}.jpg`,
        name: `file${i + 1}.jpg`,
        size: 102400,
        mimeType: "image/jpeg",
        createdAt: new Date(`2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`),
      }));

      const mockStorage = {
        list: jest.fn().mockResolvedValue(manyFiles),
        getUrl: jest.fn((path: string) => Promise.resolve(`/${path}`)),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media?page=2&limit=10");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.files).toHaveLength(10);
      expect(data.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it("should sort files by creation date (newest first)", async () => {
      const mockStorage = {
        list: jest.fn().mockResolvedValue(mockFiles),
        getUrl: jest.fn((path: string) => Promise.resolve(`/${path}`)),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media?page=1&limit=20");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Files should be sorted by createdAt descending (newest first)
      expect(data.data.files[0].name).toBe("document.pdf"); // Latest
      expect(data.data.files[2].name).toBe("image1.jpg"); // Oldest
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

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 403 for non-admin user", async () => {
      const nonAdminUser = {
        id: "user-456",
        email: "user@example.com",
        name: "Regular User",
        role: "USER",
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(nonAdminUser);
      (requireAdmin as jest.Mock).mockReturnValue({
        status: 403,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: { message: "Admin access required", code: "FORBIDDEN" },
        }),
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should handle storage errors gracefully", async () => {
      const mockStorage = {
        list: jest.fn().mockRejectedValue(new Error("Storage error")),
        getUrl: jest.fn(),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });

    it("should limit maximum page size to 50", async () => {
      const mockStorage = {
        list: jest.fn().mockResolvedValue(mockFiles),
        getUrl: jest.fn((path: string) => Promise.resolve(`/${path}`)),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media?page=1&limit=100");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.limit).toBe(50); // Should be capped at 50
    });
  });

  describe("DELETE /api/media/[path]", () => {
    it("should delete file successfully when not in use", async () => {
      const mockStorage = {
        getUrl: jest.fn().mockResolvedValue("/uploads/test.jpg"),
        delete: jest.fn().mockResolvedValue(undefined),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);
      (checkFileUsage as jest.Mock).mockResolvedValue([]);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media/uploads%2Ftest.jpg");

      const response = await DELETE_PATH(request, {
        params: Promise.resolve({ path: "uploads%2Ftest.jpg" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("File deleted successfully");
      expect(mockStorage.delete).toHaveBeenCalledWith("uploads/test.jpg");
      expect(checkFileUsage).toHaveBeenCalled();
    });

    it("should return FILE_IN_USE error when file is used in articles", async () => {
      const mockStorage = {
        getUrl: jest.fn().mockResolvedValue("/uploads/test.jpg"),
        delete: jest.fn(),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);
      (checkFileUsage as jest.Mock).mockResolvedValue(["article-1", "article-2"]);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media/uploads%2Ftest.jpg");

      const response = await DELETE_PATH(request, {
        params: Promise.resolve({ path: "uploads%2Ftest.jpg" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FILE_IN_USE");
      expect(data.error.inUse).toBe(true);
      expect(data.error.articleIds).toEqual(["article-1", "article-2"]);
      expect(mockStorage.delete).not.toHaveBeenCalled();
    });

    it("should allow force delete when force=true parameter is provided", async () => {
      const mockStorage = {
        getUrl: jest.fn().mockResolvedValue("/uploads/test.jpg"),
        delete: jest.fn().mockResolvedValue(undefined),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);
      // Note: checkFileUsage should not be called when force=true

      const { NextRequest } = await import("next/server");
      const request = new NextRequest(
        "http://localhost/api/media/uploads%2Ftest.jpg?force=true"
      );

      const response = await DELETE_PATH(request, {
        params: Promise.resolve({ path: "uploads%2Ftest.jpg" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("File deleted successfully");
      expect(mockStorage.delete).toHaveBeenCalledWith("uploads/test.jpg");
      // Should not check file usage when force=true
      expect(checkFileUsage).not.toHaveBeenCalled();
    });

    it("should return 404 when file does not exist", async () => {
      const mockStorage = {
        getUrl: jest.fn().mockRejectedValue(new Error("File not found")),
        delete: jest.fn(),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media/uploads%2Fnonexistent.jpg");

      const response = await DELETE_PATH(request, {
        params: Promise.resolve({ path: "uploads%2Fnonexistent.jpg" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FILE_NOT_FOUND");
      expect(mockStorage.delete).not.toHaveBeenCalled();
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

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media/uploads%2Ftest.jpg");

      const response = await DELETE_PATH(request, {
        params: Promise.resolve({ path: "uploads%2Ftest.jpg" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 403 for non-admin user", async () => {
      const nonAdminUser = {
        id: "user-456",
        email: "user@example.com",
        name: "Regular User",
        role: "USER",
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(nonAdminUser);
      (requireAdmin as jest.Mock).mockReturnValue({
        status: 403,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: { message: "Admin access required", code: "FORBIDDEN" },
        }),
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media/uploads%2Ftest.jpg");

      const response = await DELETE_PATH(request, {
        params: Promise.resolve({ path: "uploads%2Ftest.jpg" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should handle storage deletion errors gracefully", async () => {
      const mockStorage = {
        getUrl: jest.fn().mockResolvedValue("/uploads/test.jpg"),
        delete: jest.fn().mockRejectedValue(new Error("Deletion failed")),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);
      (checkFileUsage as jest.Mock).mockResolvedValue([]);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/media/uploads%2Ftest.jpg");

      const response = await DELETE_PATH(request, {
        params: Promise.resolve({ path: "uploads%2Ftest.jpg" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });

    it("should decode URL-encoded file path correctly", async () => {
      const mockStorage = {
        getUrl: jest.fn().mockResolvedValue("/uploads/test file.jpg"),
        delete: jest.fn().mockResolvedValue(undefined),
      };

      (getStorage as jest.Mock).mockReturnValue(mockStorage);
      (checkFileUsage as jest.Mock).mockResolvedValue([]);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest(
        "http://localhost/api/media/uploads%2Ftest%20file.jpg"
      );

      const response = await DELETE_PATH(request, {
        params: Promise.resolve({ path: "uploads%2Ftest%20file.jpg" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should decode the path correctly
      expect(mockStorage.delete).toHaveBeenCalledWith("uploads/test file.jpg");
    });
  });
});

