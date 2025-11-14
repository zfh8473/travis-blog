/**
 * Unit tests for article tag display functionality.
 * 
 * Tests tag display on article detail page, tag filtering,
 * and tag navigation links.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { useParams, useSearchParams } from "next/navigation";
import ArticleDetailPage from "@/app/articles/[slug]/page";
import TagFilterPage from "@/app/articles/tag/[slug]/page";
import ArticlesListPage from "@/app/articles/page";

// Mock Next.js navigation
const mockSearchParams = new URLSearchParams();
const mockUseRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(() => mockSearchParams),
  useRouter: jest.fn(() => mockUseRouter),
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  format: jest.fn((date, formatStr, options) => "2024年01月01日"),
}));

jest.mock("date-fns/locale", () => ({
  zhCN: {},
}));

describe("Article Tag Display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Reset search params mock
    mockSearchParams.delete("page");
    mockSearchParams.delete("limit");
  });

  describe("Article Detail Page - Tag Display", () => {
    const mockArticle = {
      id: "article-1",
      title: "Test Article",
      content: "<p>Article content</p>",
      excerpt: "Article excerpt",
      slug: "test-article",
      status: "PUBLISHED" as const,
      categoryId: "category-1",
      category: {
        id: "category-1",
        name: "技术",
        slug: "tech",
      },
      publishedAt: "2024-01-01T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      author: {
        id: "user-1",
        name: "Test User",
        image: null,
      },
      tags: [
        { id: "tag-1", name: "React", slug: "react" },
        { id: "tag-2", name: "Next.js", slug: "nextjs" },
      ],
    };

    it("should display article with clickable tags", async () => {
      (useParams as jest.Mock).mockReturnValue({ slug: "test-article" });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockArticle,
        }),
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article")).toBeInTheDocument();
      });

      // Check tags are displayed
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("Next.js")).toBeInTheDocument();
      
      // Check tag links exist
      const reactLink = screen.getByText("React").closest("a");
      const nextjsLink = screen.getByText("Next.js").closest("a");
      expect(reactLink).toHaveAttribute("href", "/articles/tag/react");
      expect(nextjsLink).toHaveAttribute("href", "/articles/tag/nextjs");
    });

    it("should handle article without tags", async () => {
      const articleWithoutTags = {
        ...mockArticle,
        tags: [],
      };

      (useParams as jest.Mock).mockReturnValue({ slug: "test-article" });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: articleWithoutTags,
        }),
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article")).toBeInTheDocument();
      });

      // Tags should not be displayed
      expect(screen.queryByText("React")).not.toBeInTheDocument();
    });
  });

  describe("Tag Filter Page", () => {
    const mockTag = {
      id: "tag-1",
      name: "React",
      slug: "react",
    };

    const mockArticles = [
      {
        id: "article-1",
        title: "Article 1",
        excerpt: "Excerpt 1",
        slug: "article-1",
        status: "PUBLISHED" as const,
        category: null,
        publishedAt: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        author: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
        tags: [mockTag],
      },
      {
        id: "article-2",
        title: "Article 2",
        excerpt: "Excerpt 2",
        slug: "article-2",
        status: "PUBLISHED" as const,
        category: null,
        publishedAt: "2024-01-02T00:00:00Z",
        createdAt: "2024-01-02T00:00:00Z",
        author: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
        tags: [mockTag],
      },
    ];

    it("should display articles filtered by tag", async () => {
      (useParams as jest.Mock).mockReturnValue({ slug: "react" });
      mockSearchParams.set("page", "1");
      mockSearchParams.set("limit", "20");
      
      // Mock tag API (using new endpoint)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockTag,
          }),
        })
        // Mock articles API
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              articles: mockArticles,
              pagination: {
                page: 1,
                limit: 20,
                total: 2,
                totalPages: 1,
              },
            },
          }),
        });

      render(<TagFilterPage />);

      await waitFor(() => {
        expect(screen.getByText("标签：React")).toBeInTheDocument();
      });

      expect(screen.getByText("Article 1")).toBeInTheDocument();
      expect(screen.getByText("Article 2")).toBeInTheDocument();
      expect(screen.getByText("共找到 2 篇文章")).toBeInTheDocument();
    });

    it("should display empty state when no articles with tag", async () => {
      (useParams as jest.Mock).mockReturnValue({ slug: "react" });
      mockSearchParams.set("page", "1");
      mockSearchParams.set("limit", "20");
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockTag,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              articles: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
              },
            },
          }),
        });

      render(<TagFilterPage />);

      await waitFor(() => {
        expect(screen.getByText("标签：React")).toBeInTheDocument();
      });

      // Check for empty state message (may appear in multiple places)
      const emptyMessages = screen.queryAllByText("该标签下暂无文章");
      expect(emptyMessages.length).toBeGreaterThan(0);
    });

    it("should handle tag not found error", async () => {
      (useParams as jest.Mock).mockReturnValue({ slug: "non-existent" });
      mockSearchParams.set("page", "1");
      mockSearchParams.set("limit", "20");
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: {
            message: "Tag not found",
            code: "TAG_NOT_FOUND",
          },
        }),
      });

      render(<TagFilterPage />);

      await waitFor(() => {
        expect(screen.getByText("标签不存在")).toBeInTheDocument();
      });
    });
  });

  describe("Articles List Page - Tag Links", () => {
    const mockArticles = [
      {
        id: "article-1",
        title: "Article 1",
        excerpt: "Excerpt 1",
        slug: "article-1",
        status: "PUBLISHED" as const,
        category: null,
        publishedAt: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        author: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
        tags: [
          { id: "tag-1", name: "React", slug: "react" },
          { id: "tag-2", name: "Next.js", slug: "nextjs" },
        ],
      },
    ];

    it("should display clickable tag links in article list", async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn(() => null),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              articles: mockArticles,
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
              },
            },
          }),
        });

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Article 1")).toBeInTheDocument();
      });

      // Check tag links exist
      const reactLink = screen.getByText("React").closest("a");
      const nextjsLink = screen.getByText("Next.js").closest("a");
      expect(reactLink).toHaveAttribute("href", "/articles/tag/react");
      expect(nextjsLink).toHaveAttribute("href", "/articles/tag/nextjs");
    });
  });
});

