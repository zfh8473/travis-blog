/**
 * Unit tests for article delete functionality.
 * 
 * Tests delete button rendering, confirmation dialog, and delete API calls
 * in both article list page and article edit page.
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import ArticlesListPage from "@/app/admin/articles/page";
import EditArticlePage from "@/app/admin/articles/[id]/edit/page";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

describe("Article Delete Functionality", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockConfirm.mockReturnValue(false); // Default to cancel
    global.fetch = jest.fn();
  });

  describe("Article List Page - Delete Button", () => {
    const mockArticles = [
      {
        id: "article-1",
        title: "Test Article 1",
        status: "PUBLISHED" as const,
        publishedAt: "2024-01-01T00:00:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        author: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
        category: null,
        tags: [],
      },
      {
        id: "article-2",
        title: "Test Article 2",
        status: "DRAFT" as const,
        publishedAt: null,
        createdAt: "2024-01-02T00:00:00Z",
        author: {
          id: "user-1",
          name: "Test User",
          image: null,
        },
        category: null,
        tags: [],
      },
    ];

    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
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
    });

    it("should render delete button for each article", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      expect(deleteButtons).toHaveLength(2);
    });

    it("should show confirmation dialog when delete button is clicked", async () => {
      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith(
        "确定要删除文章《Test Article 1》吗？此操作无法撤销。"
      );
    });

    it("should not delete article if user cancels confirmation", async () => {
      mockConfirm.mockReturnValue(false);

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial load
    });

    it("should call delete API when user confirms deletion", async () => {
      mockConfirm.mockReturnValue(true);

      (global.fetch as jest.Mock)
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
        })
        .mockResolvedValueOnce({
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
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });
    });

    it("should show success message after successful deletion", async () => {
      mockConfirm.mockReturnValue(true);

      (global.fetch as jest.Mock)
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
        })
        .mockResolvedValueOnce({
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
        expect(screen.getByText("文章删除成功！")).toBeInTheDocument();
      });
    });

    it("should show error message when article not found (404)", async () => {
      // Set up mock to return true
      mockConfirm.mockReturnValue(true);

      // Set up fetch mocks
      (global.fetch as jest.Mock)
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
        })
        .mockResolvedValueOnce({
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

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      
      // Click delete button - this should trigger window.confirm
      // Use fireEvent like the success test does
      fireEvent.click(deleteButtons[0]);
      
      // Verify confirm was called
      expect(mockConfirm).toHaveBeenCalledWith(
        "确定要删除文章《Test Article 1》吗？此操作无法撤销。"
      );

      // Wait for error message to appear (same pattern as success message test)
      await waitFor(
        () => {
          expect(screen.getByText("文章不存在")).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Verify success message is not present
      expect(screen.queryByText("文章删除成功！")).not.toBeInTheDocument();
    }, 15000);

    it("should show error message when user lacks permissions (403)", async () => {
      // Set up mock to return true
      mockConfirm.mockReturnValue(true);

      // Set up fetch mocks
      (global.fetch as jest.Mock)
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
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({
            success: false,
            error: {
              message: "Forbidden",
              code: "FORBIDDEN",
            },
          }),
        });

      render(<ArticlesListPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      
      // Click delete button - this should trigger window.confirm
      // Use fireEvent like the success test does
      fireEvent.click(deleteButtons[0]);
      
      // Verify confirm was called
      expect(mockConfirm).toHaveBeenCalledWith(
        "确定要删除文章《Test Article 1》吗？此操作无法撤销。"
      );

      // Wait for error message to appear (same pattern as success message test)
      await waitFor(
        () => {
          expect(screen.getByText("权限不足，需要管理员权限")).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Verify success message is not present
      expect(screen.queryByText("文章删除成功！")).not.toBeInTheDocument();
    }, 15000);
  });

  describe("Article Edit Page - Delete Button", () => {
    const mockArticle = {
      id: "article-1",
      title: "Test Article",
      content: "<p>Test content</p>",
      excerpt: null,
      categoryId: null,
      tags: [],
      status: "PUBLISHED" as const,
    };

    beforeEach(() => {
      const { useParams } = require("next/navigation");
      useParams.mockReturnValue({ id: "article-1" });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockArticle,
          }),
        })
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
            data: [],
          }),
        });
    });

    it("should render delete button in edit page", async () => {
      render(<EditArticlePage />);

      await waitFor(() => {
        expect(screen.getByText("删除文章")).toBeInTheDocument();
      });
    });

    it("should show confirmation dialog when delete button is clicked", async () => {
      render(<EditArticlePage />);

      await waitFor(() => {
        expect(screen.getByText("删除文章")).toBeInTheDocument();
      });

      const deleteButton = screen.getByText("删除文章");
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        "确定要删除文章《Test Article》吗？此操作无法撤销。"
      );
    });

    it("should redirect to article list after successful deletion", async () => {
      mockConfirm.mockReturnValue(true);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockArticle,
          }),
        })
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
            data: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: "Article deleted successfully",
          }),
        });

      render(<EditArticlePage />);

      await waitFor(() => {
        expect(screen.getByText("删除文章")).toBeInTheDocument();
      });

      const deleteButton = screen.getByText("删除文章");
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/admin/articles");
      });
    });
  });
});

