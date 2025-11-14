/**
 * Integration tests for public article API endpoints.
 * 
 * Tests the public article API routes including:
 * - GET /api/articles/public - List published articles with filtering
 * - GET /api/articles/public/[slug] - Get published article by slug
 * 
 * These endpoints are public and do not require authentication.
 * 
 * Note: These tests require a database connection.
 * To run these tests, ensure DATABASE_URL is set in your environment.
 */

import { GET as GET_LIST } from "@/app/api/articles/public/route";
import { GET as GET_DETAIL } from "@/app/api/articles/public/[slug]/route";
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

describe("Public Article API Integration Tests", () => {
  // Skip integration tests if DATABASE_URL is not set
  const shouldSkip = !process.env.DATABASE_URL;

  beforeAll(async () => {
    if (shouldSkip) {
      console.log(
        "⚠️  DATABASE_URL not set. Skipping integration tests that require database."
      );
      return;
    }
  });

  afterAll(async () => {
    if (shouldSkip) return;
    await prisma.$disconnect();
  });

  describe("GET /api/articles/public - List Published Articles", () => {
    let testUser: any;
    let testCategory: any;
    let publishedArticle: any;
    let draftArticle: any;

    beforeAll(async () => {
      if (shouldSkip) return;

      // Create test user
      testUser = await prisma.user.create({
        data: {
          email: `test-public-${Date.now()}@example.com`,
          name: "Test User",
          role: Role.ADMIN,
        },
      });

      // Create test category
      testCategory = await prisma.category.create({
        data: {
          name: `Test Category ${Date.now()}`,
          slug: `test-category-${Date.now()}`,
        },
      });

      // Create published article
      publishedArticle = await prisma.article.create({
        data: {
          title: "Published Article",
          content: "Published content",
          slug: `published-article-${Date.now()}`,
          status: "PUBLISHED",
          authorId: testUser.id,
          categoryId: testCategory.id,
          publishedAt: new Date(),
        },
      });

      // Create draft article (should not appear in public API)
      draftArticle = await prisma.article.create({
        data: {
          title: "Draft Article",
          content: "Draft content",
          slug: `draft-article-${Date.now()}`,
          status: "DRAFT",
          authorId: testUser.id,
        },
      });
    });

    afterAll(async () => {
      if (shouldSkip) return;

      // Cleanup
      await prisma.article.deleteMany({
        where: {
          id: {
            in: [publishedArticle.id, draftArticle.id],
          },
        },
      });
      await prisma.category.delete({ where: { id: testCategory.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it("should return only published articles", async () => {
      if (shouldSkip) {
        return;
      }

      const request = new (await import("next/server")).NextRequest(
        "http://localhost/api/articles/public"
      );
      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toBeDefined();
      
      // Should only contain published articles
      const articleIds = data.data.articles.map((a: any) => a.id);
      expect(articleIds).toContain(publishedArticle.id);
      expect(articleIds).not.toContain(draftArticle.id);
    });

    it("should filter articles by categoryId", async () => {
      if (shouldSkip) {
        return;
      }

      const request = new (await import("next/server")).NextRequest(
        `http://localhost/api/articles/public?categoryId=${testCategory.id}`
      );
      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toBeDefined();
      
      // All articles should have the specified category
      data.data.articles.forEach((article: any) => {
        expect(article.categoryId).toBe(testCategory.id);
      });
    });

    it("should filter articles by categorySlug", async () => {
      if (shouldSkip) {
        return;
      }

      const request = new (await import("next/server")).NextRequest(
        `http://localhost/api/articles/public?categorySlug=${testCategory.slug}`
      );
      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toBeDefined();
      
      // All articles should have the specified category
      data.data.articles.forEach((article: any) => {
        expect(article.categoryId).toBe(testCategory.id);
      });
    });

    it("should return empty array when category not found", async () => {
      if (shouldSkip) {
        return;
      }

      const request = new (await import("next/server")).NextRequest(
        "http://localhost/api/articles/public?categorySlug=non-existent"
      );
      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toEqual([]);
    });

    it("should support pagination", async () => {
      if (shouldSkip) {
        return;
      }

      const request = new (await import("next/server")).NextRequest(
        "http://localhost/api/articles/public?page=1&limit=10"
      );
      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pagination).toBeDefined();
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(10);
    });
  });

  describe("GET /api/articles/public/[slug] - Get Article by Slug", () => {
    let testUser: any;
    let publishedArticle: any;
    let draftArticle: any;

    beforeAll(async () => {
      if (shouldSkip) return;

      // Create test user
      testUser = await prisma.user.create({
        data: {
          email: `test-public-detail-${Date.now()}@example.com`,
          name: "Test User",
          role: Role.ADMIN,
        },
      });

      // Create published article
      publishedArticle = await prisma.article.create({
        data: {
          title: "Published Article for Detail",
          content: "Published content",
          slug: `published-detail-${Date.now()}`,
          status: "PUBLISHED",
          authorId: testUser.id,
          publishedAt: new Date(),
        },
      });

      // Create draft article
      draftArticle = await prisma.article.create({
        data: {
          title: "Draft Article for Detail",
          content: "Draft content",
          slug: `draft-detail-${Date.now()}`,
          status: "DRAFT",
          authorId: testUser.id,
        },
      });
    });

    afterAll(async () => {
      if (shouldSkip) return;

      // Cleanup
      await prisma.article.deleteMany({
        where: {
          id: {
            in: [publishedArticle.id, draftArticle.id],
          },
        },
      });
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it("should return published article by slug", async () => {
      if (shouldSkip) {
        return;
      }

      const request = new (await import("next/server")).NextRequest(
        `http://localhost/api/articles/public/${publishedArticle.slug}`
      );
      const response = await GET_DETAIL(request, {
        params: Promise.resolve({ slug: publishedArticle.slug }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(publishedArticle.id);
      expect(data.data.status).toBe("PUBLISHED");
    });

    it("should return 404 for draft article", async () => {
      if (shouldSkip) {
        return;
      }

      const request = new (await import("next/server")).NextRequest(
        `http://localhost/api/articles/public/${draftArticle.slug}`
      );
      const response = await GET_DETAIL(request, {
        params: Promise.resolve({ slug: draftArticle.slug }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("ARTICLE_NOT_FOUND");
    });

    it("should return 404 for non-existent article", async () => {
      if (shouldSkip) {
        return;
      }

      const request = new (await import("next/server")).NextRequest(
        "http://localhost/api/articles/public/non-existent-slug"
      );
      const response = await GET_DETAIL(request, {
        params: Promise.resolve({ slug: "non-existent-slug" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("ARTICLE_NOT_FOUND");
    });

    it("should include category relation", async () => {
      if (shouldSkip) {
        return;
      }

      // Create article with category
      const testCategory = await prisma.category.create({
        data: {
          name: `Test Category Detail ${Date.now()}`,
          slug: `test-category-detail-${Date.now()}`,
        },
      });

      const articleWithCategory = await prisma.article.create({
        data: {
          title: "Article with Category",
          content: "Content",
          slug: `article-with-category-${Date.now()}`,
          status: "PUBLISHED",
          authorId: testUser.id,
          categoryId: testCategory.id,
          publishedAt: new Date(),
        },
      });

      const request = new (await import("next/server")).NextRequest(
        `http://localhost/api/articles/public/${articleWithCategory.slug}`
      );
      const response = await GET_DETAIL(request, {
        params: Promise.resolve({ slug: articleWithCategory.slug }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.category).toBeDefined();
      expect(data.data.category.id).toBe(testCategory.id);

      // Cleanup
      await prisma.article.delete({ where: { id: articleWithCategory.id } });
      await prisma.category.delete({ where: { id: testCategory.id } });
    });
  });
});

