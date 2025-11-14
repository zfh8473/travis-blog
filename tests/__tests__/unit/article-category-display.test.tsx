/**
 * Unit tests for article category display functionality.
 * 
 * Tests category display on article detail page, category filtering,
 * and category navigation links.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { useParams, useSearchParams } from "next/navigation";
import ArticleDetailPage from "@/app/articles/[slug]/page";
import CategoryFilterPage from "@/app/articles/category/[slug]/page";
import ArticlesListPage from "@/app/articles/page";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  format: jest.fn((date, formatStr, options) => "2024年01月01日"),
}));

jest.mock("date-fns/locale", () => ({
  zhCN: {},
}));

describe("Article Category Display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("Article Detail Page - Category Display", () => {
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
      tags: [],
    };

    it("should display article with category", async () => {
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

      // Check category is displayed
      expect(screen.getByText("技术")).toBeInTheDocument();
      
      // Check category link exists
      const categoryLink = screen.getByText("技术").closest("a");
      expect(categoryLink).toHaveAttribute("href", "/articles/category/tech");
    });

    it("should display '未分类' when article has no category", async () => {
      const articleWithoutCategory = {
        ...mockArticle,
        categoryId: null,
        category: null,
      };

      (useParams as jest.Mock).mockReturnValue({ slug: "test-article" });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: articleWithoutCategory,
        }),
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article")).toBeInTheDocument();
      });

      // Check "未分类" is displayed
      expect(screen.getByText("未分类")).toBeInTheDocument();
    });

    it("should handle article not found error", async () => {
      (useParams as jest.Mock).mockReturnValue({ slug: "non-existent" });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: {
            message: "Article not found",
            code: "ARTICLE_NOT_FOUND",
          },
        }),
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("文章不存在")).toBeInTheDocument();
      });
    });

    it("should display article tags", async () => {
      const articleWithTags = {
        ...mockArticle,
        tags: [
          { id: "tag-1", name: "React", slug: "react" },
          { id: "tag-2", name: "Next.js", slug: "nextjs" },
        ],
      };

      (useParams as jest.Mock).mockReturnValue({ slug: "test-article" });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: articleWithTags,
        }),
      });

      render(<ArticleDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article")).toBeInTheDocument();
      });

      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("Next.js")).toBeInTheDocument();
    });
  });

  describe("Category Filter Page", () => {
    const mockCategory = {
      id: "category-1",
      name: "技术",
      slug: "tech",
    };

    const mockArticles = [
      {
        id: "article-1",
        title: "Article 1",
        excerpt: "Excerpt 1",
        slug: "article-1",
        status: "PUBLISHED" as const,
        category: mockCategory,
        publishedAt: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        author: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
        tags: [],
      },
      {
        id: "article-2",
        title: "Article 2",
        excerpt: "Excerpt 2",
        slug: "article-2",
        status: "PUBLISHED" as const,
        category: mockCategory,
        publishedAt: "2024-01-02T00:00:00Z",
        createdAt: "2024-01-02T00:00:00Z",
        author: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
        tags: [],
      },
    ];

    it("should display articles filtered by category", async () => {
      (useParams as jest.Mock).mockReturnValue({ slug: "tech" });
      
      // Mock categories API
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [mockCategory],
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

      render(<CategoryFilterPage />);

      await waitFor(() => {
        expect(screen.getByText("分类：技术")).toBeInTheDocument();
      });

      expect(screen.getByText("Article 1")).toBeInTheDocument();
      expect(screen.getByText("Article 2")).toBeInTheDocument();
      expect(screen.getByText("共找到 2 篇文章")).toBeInTheDocument();
    });

    it("should display empty state when no articles in category", async () => {
      (useParams as jest.Mock).mockReturnValue({ slug: "tech" });
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [mockCategory],
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

      render(<CategoryFilterPage />);

      await waitFor(() => {
        expect(screen.getByText("分类：技术")).toBeInTheDocument();
      });

      // Check for empty state message (may appear in multiple places)
      const emptyMessages = screen.queryAllByText("该分类下暂无文章");
      expect(emptyMessages.length).toBeGreaterThan(0);
    });

    it("should handle category not found error", async () => {
      (useParams as jest.Mock).mockReturnValue({ slug: "non-existent" });
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(<CategoryFilterPage />);

      await waitFor(() => {
        expect(screen.getByText("分类不存在")).toBeInTheDocument();
      });
    });
  });

  describe("Articles List Page", () => {
    const mockCategories = [
      { id: "category-1", name: "技术", slug: "tech" },
      { id: "category-2", name: "生活", slug: "life" },
    ];

    const mockArticles = [
      {
        id: "article-1",
        title: "Article 1",
        excerpt: "Excerpt 1",
        slug: "article-1",
        status: "PUBLISHED" as const,
        category: mockCategories[0],
        publishedAt: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        author: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
        tags: [],
      },
    ];

    it("should display all articles", async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn(() => null),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockCategories,
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
        expect(screen.getByText("所有文章")).toBeInTheDocument();
      });

      expect(screen.getByText("Article 1")).toBeInTheDocument();
    });

    it("should display category filter buttons", async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn(() => null),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockCategories,
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
        expect(screen.getByText("所有文章")).toBeInTheDocument();
      });

      // Check category filter buttons exist (may appear multiple times)
      const techButtons = screen.queryAllByText("技术");
      const lifeButtons = screen.queryAllByText("生活");
      expect(techButtons.length).toBeGreaterThan(0);
      expect(lifeButtons.length).toBeGreaterThan(0);
    });

    it("should filter articles by category when categoryId is provided", async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn((key) => (key === "categoryId" ? "category-1" : null)),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockCategories,
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
        expect(screen.getByText("分类：技术")).toBeInTheDocument();
      });
    });

    it("should display empty state when no articles", async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn(() => null),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockCategories,
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

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("所有文章")).toBeInTheDocument();
      });

      // Check for empty state message (may appear multiple times, use queryAllByText)
      const emptyMessages = screen.queryAllByText("暂无文章");
      expect(emptyMessages.length).toBeGreaterThan(0);
    });
  });
});

