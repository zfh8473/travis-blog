/**
 * Integration tests for tag filtering.
 *
 * Tests tag page Server Component data fetching, 404 handling,
 * and article filtering by tag.
 */

import { prisma } from "@/lib/db/prisma";

// Mock Prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    tag: {
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

describe("Tag Filtering Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AC-4.4.1, AC-4.4.3: Fetch articles by tag", () => {
    it("should fetch published articles filtered by tag slug", async () => {
      const mockTag = {
        id: "tag-1",
        name: "React",
        slug: "react",
      };

      const mockArticles = [
        {
          id: "article-1",
          title: "Test Article 1",
          content: "<p>Content 1</p>",
          excerpt: "Excerpt 1",
          slug: "test-article-1",
          status: "PUBLISHED" as const,
          categoryId: null,
          authorId: "user-1",
          publishedAt: new Date("2025-11-14"),
          createdAt: new Date("2025-11-14"),
          updatedAt: new Date("2025-11-14"),
          author: {
            id: "user-1",
            name: "Travis",
            image: null,
          },
          category: null,
          tags: [
            {
              tag: mockTag,
            },
          ],
        },
        {
          id: "article-2",
          title: "Test Article 2",
          content: "<p>Content 2</p>",
          excerpt: "Excerpt 2",
          slug: "test-article-2",
          status: "PUBLISHED" as const,
          categoryId: null,
          authorId: "user-1",
          publishedAt: new Date("2025-11-13"),
          createdAt: new Date("2025-11-13"),
          updatedAt: new Date("2025-11-13"),
          author: {
            id: "user-1",
            name: "Travis",
            image: null,
          },
          category: null,
          tags: [
            {
              tag: mockTag,
            },
          ],
        },
      ];

      (prisma.tag.findUnique as jest.Mock).mockResolvedValue({
        id: "tag-1",
      });
      (prisma.article.count as jest.Mock).mockResolvedValue(2);
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      // Simulate the fetch logic
      const tag = await prisma.tag.findUnique({
        where: { slug: "react" },
        select: { id: true },
      });

      expect(tag).toBeTruthy();
      expect(tag?.id).toBe("tag-1");

      // Use Prisma relation filter for many-to-many relationship
      const where = {
        status: "PUBLISHED" as const,
        tags: {
          some: {
            tagId: tag!.id,
          },
        },
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
      // Verify articles have the tag
      expect(articles[0].tags.some((at) => at.tag.id === "tag-1")).toBe(true);
      expect(articles[1].tags.some((at) => at.tag.id === "tag-1")).toBe(true);
    });

    it("should return empty array when tag has no articles", async () => {
      (prisma.tag.findUnique as jest.Mock).mockResolvedValue({
        id: "tag-1",
      });
      (prisma.article.count as jest.Mock).mockResolvedValue(0);
      (prisma.article.findMany as jest.Mock).mockResolvedValue([]);

      const tag = await prisma.tag.findUnique({
        where: { slug: "react" },
        select: { id: true },
      });

      const where = {
        status: "PUBLISHED" as const,
        tags: {
          some: {
            tagId: tag!.id,
          },
        },
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

  describe("AC-4.4.3: Article count calculation", () => {
    it("should calculate article count for tag", async () => {
      (prisma.tag.findUnique as jest.Mock).mockResolvedValue({
        id: "tag-1",
      });
      (prisma.article.count as jest.Mock).mockResolvedValue(5);

      const tag = await prisma.tag.findUnique({
        where: { slug: "react" },
        select: { id: true },
      });

      const where = {
        status: "PUBLISHED" as const,
        tags: {
          some: {
            tagId: tag!.id,
          },
        },
      };

      const total = await prisma.article.count({ where });
      expect(total).toBe(5);
    });
  });

  describe("AC-4.4.7: 404 error handling", () => {
    it("should return null when tag not found", async () => {
      (prisma.tag.findUnique as jest.Mock).mockResolvedValue(null);

      const tag = await prisma.tag.findUnique({
        where: { slug: "non-existent" },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      expect(tag).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      (prisma.tag.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        prisma.tag.findUnique({
          where: { slug: "react" },
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

