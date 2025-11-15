/**
 * Unit tests for Admin Articles List page.
 * 
 * Tests the articles list component including:
 * - Article list rendering
 * - Status filter functionality
 * - Search functionality
 * - Delete confirmation and deletion
 * - Navigation buttons (New Article, Edit)
 * - Statistics display
 * - URL parameter management
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import ArticlesListPage from "@/app/admin/articles/page";

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  })),
  useSearchParams: jest.fn(() => mockSearchParams),
}));

// Mock fetch
global.fetch = jest.fn();

describe("AdminArticlesListPage", () => {
  const mockArticles = [
    {
      id: "article-1",
      title: "Test Article 1",
      status: "PUBLISHED" as const,
      publishedAt: "2024-01-01T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      author: {
        id: "user-1",
        name: "Test Author",
        image: null,
      },
      category: {
        id: "cat-1",
        name: "技术",
      },
      tags: [
        { id: "tag-1", name: "React" },
        { id: "tag-2", name: "Next.js" },
      ],
    },
    {
      id: "article-2",
      title: "Draft Article",
      status: "DRAFT" as const,
      publishedAt: null,
      createdAt: "2024-01-02T00:00:00Z",
      author: {
        id: "user-1",
        name: "Test Author",
        image: null,
      },
      category: null,
      tags: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.delete("status");
    mockSearchParams.delete("search");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          articles: mockArticles,
          pagination: {
            page: 1,
            limit: 1000,
            total: 2,
            totalPages: 1,
          },
        },
      }),
    });
  });

  describe("Article list rendering", () => {
    it("should render articles list with all articles", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
        expect(screen.getByText("Draft Article")).toBeInTheDocument();
      });
    });

    it("should display article title, status, author, and publish date", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
        expect(screen.getByText("已发布")).toBeInTheDocument();
        expect(screen.getByText("Test Author")).toBeInTheDocument();
      });
    });

    it("should display category and tags as badges", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("技术")).toBeInTheDocument();
        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText("Next.js")).toBeInTheDocument();
      });
    });

    it("should show empty state when no articles", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            articles: [],
            pagination: {
              page: 1,
              limit: 1000,
              total: 0,
              totalPages: 0,
            },
          },
        }),
      });

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("暂无文章")).toBeInTheDocument();
      });
    });
  });

  describe("Status filter functionality", () => {
    it("should filter articles by published status", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText("状态筛选");
      fireEvent.change(filterSelect, { target: { value: "published" } });

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });
      
      // Draft article should be filtered out
      expect(screen.queryByText("Draft Article")).not.toBeInTheDocument();
    });

    it("should filter articles by draft status", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Draft Article")).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText("状态筛选");
      fireEvent.change(filterSelect, { target: { value: "drafts" } });

      await waitFor(() => {
        expect(screen.getByText("Draft Article")).toBeInTheDocument();
      });
      
      // Published article should be filtered out
      expect(screen.queryByText("Test Article 1")).not.toBeInTheDocument();
    });

    it("should show all articles when filter is 'all'", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText("状态筛选");
      fireEvent.change(filterSelect, { target: { value: "all" } });

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
        expect(screen.getByText("Draft Article")).toBeInTheDocument();
      });
    });

    it("should update URL when status filter changes", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText("状态筛选");
      fireEvent.change(filterSelect, { target: { value: "published" } });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
      });
    });
  });

  describe("Search functionality", () => {
    it("should filter articles by search query", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText("搜索文章");
      fireEvent.change(searchInput, { target: { value: "Test Article" } });

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
        expect(screen.queryByText("Draft Article")).not.toBeInTheDocument();
      });
    });

    it("should show no results when search doesn't match", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText("搜索文章");
      fireEvent.change(searchInput, { target: { value: "Non-existent" } });

      await waitFor(() => {
        expect(screen.getByText("没有找到匹配的文章")).toBeInTheDocument();
      });
    });

    it("should update URL with search parameter (debounced)", async () => {
      jest.useFakeTimers();
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText("搜索文章");
      fireEvent.change(searchInput, { target: { value: "Test" } });

      // Fast-forward timers to trigger debounce
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe("Article statistics display", () => {
    it("should display total articles count", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("总文章数")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("should display published articles count", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("已发布")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });

    it("should display draft articles count", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("草稿")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation buttons", () => {
    it("should have 'New Article' button linking to /admin/articles/new", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        const newArticleButton = screen.getByText("新建文章");
        expect(newArticleButton).toBeInTheDocument();
        expect(newArticleButton.closest("a")).toHaveAttribute(
          "href",
          "/admin/articles/new"
        );
      });
    });

    it("should have 'Edit' button for each article", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        const editButtons = screen.getAllByText("编辑");
        expect(editButtons.length).toBeGreaterThan(0);
        expect(editButtons[0].closest("a")).toHaveAttribute(
          "href",
          "/admin/articles/article-1/edit"
        );
      });
    });
  });

  describe("Delete functionality", () => {
    it("should show confirmation dialog when delete is clicked", async () => {
      window.confirm = jest.fn(() => false); // User cancels

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining("确定要删除文章《Test Article 1》吗？")
      );
    });

    it("should delete article when confirmed", async () => {
      window.confirm = jest.fn(() => true); // User confirms

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Article deleted successfully",
        }),
      });

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/articles/article-1",
          expect.objectContaining({ method: "DELETE" })
        );
      });

      await waitFor(() => {
        expect(screen.getByText("文章删除成功！")).toBeInTheDocument();
      });
    });

    it("should show error message when delete fails", async () => {
      window.confirm = jest.fn(() => true);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { message: "Article not found" },
        }),
      });

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("文章不存在")).toBeInTheDocument();
      });
    });
  });

  describe("URL parameter management", () => {
    it("should read status filter from URL on mount", async () => {
      mockSearchParams.set("status", "published");

      render(<ArticlesListPage />);

      await waitFor(() => {
        const filterSelect = screen.getByLabelText("状态筛选") as HTMLSelectElement;
        expect(filterSelect.value).toBe("published");
      });
    });

    it("should read search query from URL on mount", async () => {
      mockSearchParams.set("search", "Test");

      render(<ArticlesListPage />);

      await waitFor(() => {
        const searchInput = screen.getByLabelText("搜索文章") as HTMLInputElement;
        expect(searchInput.value).toBe("Test");
      });
    });
  });

  describe("Loading and error states", () => {
    it("should show loading state initially", () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ArticlesListPage />);

      expect(screen.getByText("加载中...")).toBeInTheDocument();
    });

    it("should show error message when API call fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("权限不足，需要管理员权限")).toBeInTheDocument();
      });
    });
  });
});

