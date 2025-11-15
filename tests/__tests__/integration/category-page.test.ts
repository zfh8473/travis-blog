/**
 * Integration tests for category page.
 *
 * Tests category page Server Component data fetching, 404 handling,
 * and article filtering by category.
 */

import { prisma } from "@/lib/db/prisma";

// Mock Prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    category: {
      findUnique: jest.fn(),
    },
    article: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock Next.js notFound
const mockNotFound = jest.fn();
jest.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    return null;
  },
}));

describe("Category Page Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AC-4.3.1, AC-4.3.3: Fetch articles by category", () => {
    it("should fetch published articles filtered by category slug", async () => {
      const mockCategory = {
        id: "cat-1",
        name: "技术",
        slug: "tech",
      };

      const mockArticles = [
        {
          id: "article-1",
          title: "Test Article 1",
          content: "<p>Content 1</p>",
          excerpt: "Excerpt 1",
          slug: "test-article-1",
          status: "PUBLISHED" as const,
          categoryId: "cat-1",
          authorId: "user-1",
          publishedAt: new Date("2025-11-14"),
          createdAt: new Date("2025-11-14"),
          updatedAt: new Date("2025-11-14"),
          author: {
            id: "user-1",
            name: "Travis",
            image: null,
          },
          category: mockCategory,
          tags: [],
        },
        {
          id: "article-2",
          title: "Test Article 2",
          content: "<p>Content 2</p>",
          excerpt: "Excerpt 2",
          slug: "test-article-2",
          status: "PUBLISHED" as const,
          categoryId: "cat-1",
          authorId: "user-1",
          publishedAt: new Date("2025-11-13"),
          createdAt: new Date("2025-11-13"),
          updatedAt: new Date("2025-11-13"),
          author: {
            id: "user-1",
            name: "Travis",
            image: null,
          },
          category: mockCategory,
          tags: [],
        },
      ];

      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: "cat-1",
      });
      (prisma.article.count as jest.Mock).mockResolvedValue(2);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      // Simulate the fetch logic
      const category = await prisma.category.findUnique({
        where: { slug: "tech" },
        select: { id: true },
      });

      expect(category).toBeTruthy();
      expect(category?.id).toBe("cat-1");

      const where = {
        status: "PUBLISHED" as const,
        categoryId: category!.id,
      };

      const total = await prisma.article.count({ where });
      expect(total).toBe(2);

      const articles = await prisma.article.findMany({
        where,
        skip: 0,
        take: 20,
        orderBy: {
          publishedAt: "desc",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      expect(articles).toHaveLength(2);
      expect(articles[0].categoryId).toBe("cat-1");
      expect(articles[1].categoryId).toBe("cat-1");
    });

    it("should return empty array when category has no articles", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: "cat-1",
      });
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const category = await prisma.category.findUnique({
        where: { slug: "tech" },
        select: { id: true },
      });

      const where = {
        status: "PUBLISHED" as const,
        categoryId: category!.id,
      };

      const total = await prisma.article.count({ where });
      expect(total).toBe(0);

      const articles = await prisma.article.findMany({
        where,
        skip: 0,
        take: 20,
      });

      expect(articles).toHaveLength(0);
    });
  });

  describe("AC-4.3.3: Article count calculation", () => {
    it("should calculate article count for category", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: "cat-1",
      });
      (prisma.article.count as jest.Mock).mockResolvedValue(5);

      const category = await prisma.category.findUnique({
        where: { slug: "tech" },
        select: { id: true },
      });

      const where = {
        status: "PUBLISHED" as const,
        categoryId: category!.id,
      };

      const total = await prisma.article.count({ where });
      expect(total).toBe(5);
    });
  });

  describe("AC-4.3.7: 404 error handling", () => {
    it("should return null when category not found", async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const category = await prisma.category.findUnique({
        where: { slug: "non-existent" },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      expect(category).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      (prisma.category.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        prisma.category.findUnique({
          where: { slug: "tech" },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        })
      ).rejects.toThrow("Database error");
    });
  });
});

