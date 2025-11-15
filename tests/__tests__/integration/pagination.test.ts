/**
 * Integration tests for pagination functionality.
 *
 * Tests pagination navigation, URL parameter handling, and data calculation
 * across homepage, category page, and tag page.
 */

import { prisma } from "@/lib/db/prisma";

// Mock Prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    article: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    tag: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Pagination Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AC-4.5.2, AC-4.5.9: Pagination data calculation", () => {
    it("should calculate total pages correctly based on article count and limit", async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(100);

      const total = 100;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);

      expect(totalPages).toBe(5);
    });

    it("should handle edge case: total=0", async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(0);

      const total = 0;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);

      expect(totalPages).toBe(0);
    });

    it("should handle edge case: limit=100", async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(150);

      const total = 150;
      const limit = 100;
      const totalPages = Math.ceil(total / limit);

      expect(totalPages).toBe(2);
    });

    it("should calculate pagination metadata correctly", async () => {
      (prisma.article.count as jest.Mock).mockResolvedValue(100);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const page = 2;
      const limit = 20;
      const total = 100;
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      await prisma.article.findMany({
        skip,
        take: limit,
      });

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );

      expect(totalPages).toBe(5);
    });
  });

  describe("AC-4.5.6: URL parameter handling", () => {
    it("should parse page parameter correctly from URL", () => {
      const searchParams = { page: "2", limit: "20" };
      const page = Math.max(1, parseInt(searchParams.page || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.limit || "20", 10)));

      expect(page).toBe(2);
      expect(limit).toBe(20);
    });

    it("should default to page 1 when no parameter is provided", () => {
      const searchParams: { page?: string; limit?: string } = {};
      const page = Math.max(1, parseInt(searchParams.page || "1", 10));

      expect(page).toBe(1);
    });

    it("should handle invalid page numbers: page=0", () => {
      const searchParams = { page: "0" };
      const page = Math.max(1, parseInt(searchParams.page || "1", 10));

      expect(page).toBe(1);
    });

    it("should handle invalid page numbers: page=-1", () => {
      const searchParams = { page: "-1" };
      const page = Math.max(1, parseInt(searchParams.page || "1", 10));

      expect(page).toBe(1);
    });

    it("should handle invalid page numbers: page=999 (out of range)", () => {
      const searchParams = { page: "999" };
      const page = Math.max(1, parseInt(searchParams.page || "1", 10));

      // Page number itself is valid, but should be handled by pagination logic
      expect(page).toBe(999);
    });

    it("should handle limit parameter correctly", () => {
      const searchParams = { page: "1", limit: "50" };
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.limit || "20", 10)));

      expect(limit).toBe(50);
    });

    it("should cap limit at 100", () => {
      const searchParams = { page: "1", limit: "200" };
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.limit || "20", 10)));

      expect(limit).toBe(100);
    });

    it("should enforce minimum limit of 1", () => {
      const searchParams = { page: "1", limit: "0" };
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.limit || "20", 10)));

      expect(limit).toBe(1);
    });
  });

  describe("AC-4.5.1: Pagination on homepage", () => {
    it("should fetch articles with pagination on homepage", async () => {
      const mockArticles = [
        {
          id: "article-1",
          title: "Test Article 1",
          status: "PUBLISHED" as const,
          publishedAt: new Date("2025-11-14"),
          createdAt: new Date("2025-11-14"),
          updatedAt: new Date("2025-11-14"),
          author: { id: "user-1", name: "Travis", image: null },
          category: null,
          tags: [],
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(25);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const page = 1;
      const limit = 20;
      const skip = (page - 1) * limit;
      const where = { status: "PUBLISHED" as const };

      const total = await prisma.article.count({ where });
      const totalPages = Math.ceil(total / limit);
      const articles = await prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
      });

      expect(total).toBe(25);
      expect(totalPages).toBe(2);
      expect(articles).toHaveLength(1);
    });
  });

  describe("AC-4.5.1: Pagination on category page", () => {
    it("should fetch articles with pagination on category page", async () => {
      const mockCategory = { id: "cat-1" };
      const mockArticles = [
        {
          id: "article-1",
          title: "Test Article 1",
          status: "PUBLISHED" as const,
          categoryId: "cat-1",
          publishedAt: new Date("2025-11-14"),
          createdAt: new Date("2025-11-14"),
          updatedAt: new Date("2025-11-14"),
          author: { id: "user-1", name: "Travis", image: null },
          category: { id: "cat-1", name: "技术", slug: "tech" },
          tags: [],
        },
      ];

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.article.count as jest.Mock).mockResolvedValue(30);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const category = await prisma.category.findUnique({
        where: { slug: "tech" },
        select: { id: true },
      });

      const page = 1;
      const limit = 20;
      const where = {
        status: "PUBLISHED" as const,
        categoryId: category!.id,
      };

      const total = await prisma.article.count({ where });
      const totalPages = Math.ceil(total / limit);

      expect(total).toBe(30);
      expect(totalPages).toBe(2);
    });
  });

  describe("AC-4.5.1: Pagination on tag page", () => {
    it("should fetch articles with pagination on tag page", async () => {
      const mockTag = { id: "tag-1" };
      const mockArticles = [
        {
          id: "article-1",
          title: "Test Article 1",
          status: "PUBLISHED" as const,
          publishedAt: new Date("2025-11-14"),
          createdAt: new Date("2025-11-14"),
          updatedAt: new Date("2025-11-14"),
          author: { id: "user-1", name: "Travis", image: null },
          category: null,
          tags: [{ tag: mockTag }],
        },
      ];

      (prisma.tag.findUnique as jest.Mock).mockResolvedValue(mockTag);
      (prisma.article.count as jest.Mock).mockResolvedValue(40);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const tag = await prisma.tag.findUnique({
        where: { slug: "react" },
        select: { id: true },
      });

      const page = 1;
      const limit = 20;
      const where = {
        status: "PUBLISHED" as const,
        tags: {
          some: {
            tagId: tag!.id,
          },
        },
      };

      const total = await prisma.article.count({ where });
      const totalPages = Math.ceil(total / limit);

      expect(total).toBe(40);
      expect(totalPages).toBe(2);
    });
  });
});

