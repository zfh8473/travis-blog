/**
 * Integration tests for Admin Articles List API.
 * 
 * Tests API integration including:
 * - Articles API call with status filter
 * - Articles API call with pagination
 * - Delete API call
 * - Permission checks (non-admin cannot access)
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/articles/route";
import { DELETE } from "@/app/api/articles/[id]/route";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

describe("Admin Articles List API Integration", () => {
  let testAdminId: string;
  let testArticleId: string;
  let testAdminHeaders: Headers;

  beforeAll(async () => {
    // Create test admin user
    const hashedPassword = await hashPassword("TestPassword123!");
    const adminUser = await prisma.user.upsert({
      where: { email: "test-admin-articles@example.com" },
      update: {},
      create: {
        email: "test-admin-articles@example.com",
        password: hashedPassword,
        name: "Test Admin",
        role: "ADMIN",
      },
    });
    testAdminId = adminUser.id;

    // Create test article
    const article = await prisma.article.create({
      data: {
        title: "Test Article for Admin List",
        content: "<p>Test content</p>",
        slug: "test-article-admin-list",
        status: "PUBLISHED",
        authorId: testAdminId,
        publishedAt: new Date(),
      },
    });
    testArticleId = article.id;

    // Create mock headers with admin user
    testAdminHeaders = new Headers();
    testAdminHeaders.set("x-user-id", testAdminId);
    testAdminHeaders.set("x-user-email", "test-admin-articles@example.com");
    testAdminHeaders.set("x-user-role", "ADMIN");
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.article.deleteMany({
        where: {
          id: testArticleId,
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: testAdminId,
        },
      });
    } catch (error) {
      console.warn("Error during test cleanup:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  describe("GET /api/articles", () => {
    it("should return articles list for admin user", async () => {
      const request = new NextRequest("http://localhost:3000/api/articles", {
        headers: testAdminHeaders,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("articles");
      expect(data.data).toHaveProperty("pagination");
      expect(Array.isArray(data.data.articles)).toBe(true);
    });

    it("should filter articles by status (PUBLISHED)", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles?status=PUBLISHED",
        {
          headers: testAdminHeaders,
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(
        data.data.articles.every((article: any) => article.status === "PUBLISHED")
      ).toBe(true);
    });

    it("should filter articles by status (DRAFT)", async () => {
      // Create a draft article
      const draftArticle = await prisma.article.create({
        data: {
          title: "Draft Article",
          content: "<p>Draft content</p>",
          slug: "draft-article-test",
          status: "DRAFT",
          authorId: testAdminId,
        },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/articles?status=DRAFT",
        {
          headers: testAdminHeaders,
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(
        data.data.articles.every((article: any) => article.status === "DRAFT")
      ).toBe(true);

      // Clean up
      await prisma.article.delete({ where: { id: draftArticle.id } });
    });

    it("should return pagination info", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles?page=1&limit=20",
        {
          headers: testAdminHeaders,
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination).toHaveProperty("page");
      expect(data.data.pagination).toHaveProperty("limit");
      expect(data.data.pagination).toHaveProperty("total");
      expect(data.data.pagination).toHaveProperty("totalPages");
    });

    it("should return 403 for non-admin user", async () => {
      const userHeaders = new Headers();
      userHeaders.set("x-user-id", "user-123");
      userHeaders.set("x-user-email", "user@example.com");
      userHeaders.set("x-user-role", "USER");

      const request = new NextRequest("http://localhost:3000/api/articles", {
        headers: userHeaders,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it("should return 401 for unauthenticated user", async () => {
      const request = new NextRequest("http://localhost:3000/api/articles", {
        headers: new Headers(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe("DELETE /api/articles/[id]", () => {
    it("should delete article for admin user", async () => {
      // Create article to delete
      const articleToDelete = await prisma.article.create({
        data: {
          title: "Article to Delete",
          content: "<p>Content</p>",
          slug: "article-to-delete",
          status: "PUBLISHED",
          authorId: testAdminId,
          publishedAt: new Date(),
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/articles/${articleToDelete.id}`,
        {
          method: "DELETE",
          headers: testAdminHeaders,
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: articleToDelete.id }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify article is deleted
      const deletedArticle = await prisma.article.findUnique({
        where: { id: articleToDelete.id },
      });
      expect(deletedArticle).toBeNull();
    });

    it("should return 404 for non-existent article", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/non-existent-id",
        {
          method: "DELETE",
          headers: testAdminHeaders,
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it("should return 403 for non-admin user", async () => {
      const userHeaders = new Headers();
      userHeaders.set("x-user-id", "user-123");
      userHeaders.set("x-user-email", "user@example.com");
      userHeaders.set("x-user-role", "USER");

      const request = new NextRequest(
        `http://localhost:3000/api/articles/${testArticleId}`,
        {
          method: "DELETE",
          headers: userHeaders,
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: testArticleId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });
});

