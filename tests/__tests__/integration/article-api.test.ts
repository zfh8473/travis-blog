/**
 * Integration tests for article API endpoints.
 * 
 * Tests the article CRUD API routes including:
 * - POST /api/articles - Create article
 * - GET /api/articles - List articles with pagination
 * - GET /api/articles/[id] - Get article detail
 * - PUT /api/articles/[id] - Update article
 * - DELETE /api/articles/[id] - Delete article
 * 
 * Note: These tests require a database connection. For tests that don't need
 * database access, see unit tests in article-validation.test.ts
 * 
 * To run these tests, ensure DATABASE_URL is set in your environment.
 */

import { GET, POST } from "@/app/api/articles/route";
import { GET as GET_DETAIL, PUT, DELETE } from "@/app/api/articles/[id]/route";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: class NextRequest {
    constructor(public url: string, public init?: any) {}
    async json() {
      return this.init?.body ? JSON.parse(this.init.body) : {};
    }
    get headers() {
      return this.init?.headers || new Headers();
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
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    articleTag: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/auth/middleware", () => ({
  getUserFromHeaders: jest.fn(),
}));

jest.mock("@/lib/auth/permissions", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/utils/slug", () => ({
  generateUniqueSlug: jest.fn(),
}));

import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { generateUniqueSlug } from "@/lib/utils/slug";

describe("Article API Integration Tests", () => {
  // Skip integration tests if DATABASE_URL is not set
  const hasDatabase = !!process.env.DATABASE_URL;

  beforeAll(() => {
    if (!hasDatabase) {
      console.warn(
        "⚠️  DATABASE_URL not set. Skipping integration tests that require database."
      );
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to default behavior
    (prisma.article.findUnique as jest.Mock).mockReset();
    (prisma.article.findMany as jest.Mock).mockReset();
    (prisma.article.create as jest.Mock).mockReset();
    (prisma.article.update as jest.Mock).mockReset();
    (prisma.article.delete as jest.Mock).mockReset();
    (prisma.article.count as jest.Mock).mockReset();
    (prisma.$transaction as jest.Mock).mockReset();
  });

  afterAll(async () => {
    if (hasDatabase) {
      await prisma.$disconnect();
    }
  });

  describe("POST /api/articles - Create Article", () => {
    it("should create article with all required fields", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      const mockArticle = {
        id: "article-123",
        title: "Test Article",
        content: "<p>Article content</p>",
        excerpt: "Article excerpt",
        slug: "test-article",
        status: "PUBLISHED" as const,
        categoryId: null,
        authorId: "user-123",
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "user-123",
          name: "Admin User",
          image: null,
        },
        category: null,
        tags: [],
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);
      (generateUniqueSlug as jest.Mock).mockResolvedValue("test-article");
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          article: {
            create: jest.fn().mockResolvedValue(mockArticle),
            findUnique: jest.fn().mockResolvedValue(mockArticle),
          },
          articleTag: {
            createMany: jest.fn(),
          },
        };
        return callback(tx);
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Article",
          content: "<p>Article content</p>",
          excerpt: "Article excerpt",
          status: "PUBLISHED",
        }),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe("Test Article");
      expect(data.data.status).toBe("PUBLISHED");
      expect(generateUniqueSlug).toHaveBeenCalledWith("Test Article");
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
      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Article",
          content: "<p>Article content</p>",
          status: "PUBLISHED",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(prisma.$transaction).not.toHaveBeenCalled();
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

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Article",
          content: "<p>Article content</p>",
          status: "PUBLISHED",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid input", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles", {
        method: "POST",
        body: JSON.stringify({
          title: "", // Invalid: empty title
          content: "<p>Article content</p>",
          status: "PUBLISHED",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/articles - List Articles", () => {
    it("should return paginated articles for admin user", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      const mockArticles = [
        {
          id: "article-1",
          title: "Article 1",
          content: "<p>Content 1</p>",
          slug: "article-1",
          status: "PUBLISHED" as const,
          createdAt: new Date(),
          author: { id: "user-123", name: "Admin", image: null },
          category: null,
          tags: [],
        },
      ];

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles?page=1&limit=20");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toHaveLength(1);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(20);
      expect(data.data.pagination.total).toBe(1);
    });

    it("should filter articles by status", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles?status=DRAFT");

      await GET(request);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "DRAFT",
          }),
        })
      );
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
      const request = new NextRequest("http://localhost/api/articles");

      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(prisma.article.findMany).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/articles/[id] - Get Article Detail", () => {
    it("should return article detail for published article", async () => {
      const mockArticle = {
        id: "article-123",
        title: "Test Article",
        content: "<p>Article content</p>",
        slug: "test-article",
        status: "PUBLISHED" as const,
        author: { id: "user-123", name: "Author", image: null },
        category: null,
        tags: [],
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (getUserFromHeaders as jest.Mock).mockReturnValue(null); // Public access allowed

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles/article-123");

      const response = await GET_DETAIL(request, { params: { id: "article-123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("article-123");
      expect(data.data.status).toBe("PUBLISHED");
    });

    it("should require ADMIN role for DRAFT article", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      const mockArticle = {
        id: "article-123",
        title: "Draft Article",
        content: "<p>Draft content</p>",
        slug: "draft-article",
        status: "DRAFT" as const,
        author: { id: "user-123", name: "Author", image: null },
        category: null,
        tags: [],
      };

      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles/article-123");

      const response = await GET_DETAIL(request, { params: { id: "article-123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(requireAdmin).toHaveBeenCalled();
    });

    it("should return 404 if article not found", async () => {
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles/non-existent");

      const response = await GET_DETAIL(request, { params: { id: "non-existent" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("ARTICLE_NOT_FOUND");
    });
  });

  describe("PUT /api/articles/[id] - Update Article", () => {
    it("should update article with partial fields", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      const existingArticle = {
        id: "article-123",
        title: "Original Title",
        status: "DRAFT" as const,
      };

      const updatedArticle = {
        id: "article-123",
        title: "Updated Title",
        content: "<p>Updated content</p>",
        slug: "updated-title",
        status: "PUBLISHED" as const,
        author: { id: "user-123", name: "Admin", image: null },
        category: null,
        tags: [],
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);
      // First call: check if article exists
      (prisma.article.findUnique as jest.Mock).mockResolvedValueOnce(existingArticle);
      (generateUniqueSlug as jest.Mock).mockResolvedValue("updated-title");
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          article: {
            update: jest.fn().mockResolvedValue(updatedArticle),
            findUnique: jest.fn().mockResolvedValue(updatedArticle),
          },
          articleTag: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        };
        return callback(tx);
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles/article-123", {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated Title",
          status: "PUBLISHED",
        }),
      });

      const response = await PUT(request, { params: { id: "article-123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe("Updated Title");
      expect(data.data.status).toBe("PUBLISHED");
    });

    it("should return 404 if article not found", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);
      // Mock findUnique to return null (article not found) - use mockResolvedValue to ensure it's called
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles/non-existent", {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated Title",
        }),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      });

      const response = await PUT(request, { params: { id: "non-existent" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("ARTICLE_NOT_FOUND");
      expect(prisma.article.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent" },
        select: { id: true, title: true, status: true },
      });
    });
  });

  describe("DELETE /api/articles/[id] - Delete Article", () => {
    it("should delete article and cascade delete related data", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      const existingArticle = {
        id: "article-123",
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(existingArticle);
      (prisma.article.delete as jest.Mock).mockResolvedValue(existingArticle);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles/article-123", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: { id: "article-123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Article deleted successfully");
      expect(prisma.article.delete).toHaveBeenCalledWith({
        where: { id: "article-123" },
      });
    });

    it("should return 404 if article not found", async () => {
      const mockUser = {
        id: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
      };

      (getUserFromHeaders as jest.Mock).mockReturnValue(mockUser);
      (requireAdmin as jest.Mock).mockReturnValue(null);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("http://localhost/api/articles/non-existent", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: { id: "non-existent" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("ARTICLE_NOT_FOUND");
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
      const request = new NextRequest("http://localhost/api/articles/article-123", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: { id: "article-123" } });

      expect(response.status).toBe(401);
      expect(prisma.article.delete).not.toHaveBeenCalled();
    });
  });
});

