/**
 * Unit tests for media library page component.
 * 
 * Tests media file list display, image preview, delete confirmation,
 * file deletion, and file-in-use warning functionality.
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaLibraryPage from "@/app/admin/media/page";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock media utilities (client-side)
jest.mock("@/lib/utils/media-client", () => ({
  formatFileSize: jest.fn((bytes: number) => {
    if (bytes < 1024) return `${bytes} Bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }),
  isImage: jest.fn((mimeType: string) => mimeType.startsWith("image/")),
}));

describe("Media Library Page", () => {
  const mockFiles = [
    {
      path: "uploads/image1.jpg",
      name: "image1.jpg",
      size: 102400,
      mimeType: "image/jpeg",
      createdAt: "2024-01-01T00:00:00Z",
      url: "/uploads/image1.jpg",
    },
    {
      path: "uploads/document.pdf",
      name: "document.pdf",
      size: 204800,
      mimeType: "application/pdf",
      createdAt: "2024-01-02T00:00:00Z",
      url: "/uploads/document.pdf",
    },
    {
      path: "uploads/image2.png",
      name: "image2.png",
      size: 512000,
      mimeType: "image/png",
      createdAt: "2024-01-03T00:00:00Z",
      url: "/uploads/image2.png",
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 20,
    total: 3,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("Media File List Display (AC-3.8.1)", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            files: mockFiles,
            pagination: mockPagination,
          },
        }),
      });
    });

    it("should render media library page with file list", async () => {
      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("媒体库")).toBeInTheDocument();
      });

      // Check if files are displayed
      expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      expect(screen.getByText("document.pdf")).toBeInTheDocument();
      expect(screen.getByText("image2.png")).toBeInTheDocument();
    });

    it("should display file metadata (filename, size, date)", async () => {
      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      // Check file size display
      expect(screen.getByText(/100\.00 KB/)).toBeInTheDocument();
      expect(screen.getByText(/200\.00 KB/)).toBeInTheDocument();
      expect(screen.getByText(/500\.00 KB/)).toBeInTheDocument();
    });

    it("should show thumbnails for image files", async () => {
      render(<MediaLibraryPage />);

      await waitFor(() => {
        const images = screen.getAllByRole("img");
        // Should have 2 images (image1.jpg and image2.png)
        expect(images.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("should show file icon for non-image files", async () => {
      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("document.pdf")).toBeInTheDocument();
      });

      // Non-image files should have SVG icon (file icon)
      const svgElements = document.querySelectorAll("svg");
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it("should display loading state initially", () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<MediaLibraryPage />);
      expect(screen.getByText("加载中...")).toBeInTheDocument();
    });

    it("should display error message on API error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { message: "Internal server error", code: "INTERNAL_ERROR" },
        }),
      });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText(/加载媒体文件失败/)).toBeInTheDocument();
      });
    });

    it("should display authentication error message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("请先登录")).toBeInTheDocument();
      });
    });

    it("should display permission error message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("权限不足，需要管理员权限")).toBeInTheDocument();
      });
    });
  });

  describe("Image Preview (AC-3.8.2)", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            files: mockFiles.filter((f) => f.mimeType.startsWith("image/")),
            pagination: mockPagination,
          },
        }),
      });
    });

    /**
     * Helper function to open image preview modal
     */
    const openImagePreview = async () => {
      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const images = screen.getAllByRole("img");
      const firstImage = images.find((img) => img.getAttribute("alt") === "image1.jpg");
      
      expect(firstImage).toBeDefined();
      expect(firstImage).toBeInTheDocument();
      fireEvent.click(firstImage!);

      await waitFor(() => {
        expect(screen.getByLabelText("关闭预览")).toBeInTheDocument();
      });
    };

    it("should open image preview modal when image is clicked", async () => {
      render(<MediaLibraryPage />);
      await openImagePreview();
    });

    it("should close image preview when close button is clicked", async () => {
      render(<MediaLibraryPage />);
      await openImagePreview();

      const closeButton = screen.getByLabelText("关闭预览");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByLabelText("关闭预览")).not.toBeInTheDocument();
      });
    });

    it("should close image preview when clicking outside modal", async () => {
      render(<MediaLibraryPage />);
      await openImagePreview();

      // Click on the backdrop (modal container)
      const modal = document.querySelector(".fixed.inset-0");
      expect(modal).toBeInTheDocument();
      fireEvent.click(modal!);

      await waitFor(() => {
        expect(screen.queryByLabelText("关闭预览")).not.toBeInTheDocument();
      });
    });

    it("should close image preview when ESC key is pressed", async () => {
      render(<MediaLibraryPage />);
      await openImagePreview();

      // Simulate ESC key press
      fireEvent.keyDown(window, { key: "Escape", code: "Escape" });

      await waitFor(() => {
        expect(screen.queryByLabelText("关闭预览")).not.toBeInTheDocument();
      });
    });
  });

  describe("Delete Confirmation Dialog (AC-3.8.3)", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            files: mockFiles,
            pagination: mockPagination,
          },
        }),
      });
    });

    it("should show delete confirmation dialog when delete button is clicked", async () => {
      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
        expect(screen.getByText(/确定要删除此文件吗/)).toBeInTheDocument();
      });
    });

    it("should close confirmation dialog when cancel is clicked", async () => {
      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("取消");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("确认删除")).not.toBeInTheDocument();
      });
    });
  });

  describe("File Deletion (AC-3.8.4)", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              files: mockFiles,
              pagination: mockPagination,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: "File deleted successfully",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              files: mockFiles.slice(1), // Remove first file
              pagination: { ...mockPagination, total: 2 },
            },
          }),
        });
    });

    it("should delete file after confirmation", async () => {
      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
      });

      const confirmButton = screen.getByText("删除");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText("文件删除成功")).toBeInTheDocument();
      });
    });

    it("should remove file from list after successful deletion", async () => {
      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
      });

      const confirmButton = screen.getByText("删除");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        // File should be removed from list
        expect(screen.queryByText("image1.jpg")).not.toBeInTheDocument();
      });
    });

    it("should show loading state during deletion", async () => {
      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
      });

      // Mock a slow delete request
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  message: "File deleted successfully",
                }),
              });
            }, 100);
          })
      );

      const confirmButton = screen.getByText("删除");
      fireEvent.click(confirmButton);

      // Should show "删除中..." during deletion
      await waitFor(() => {
        expect(screen.getByText("删除中...")).toBeInTheDocument();
      });
    });

    it("should display error message on deletion failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              files: mockFiles,
              pagination: mockPagination,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            error: { message: "Failed to delete file", code: "INTERNAL_ERROR" },
          }),
        });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
      });

      const confirmButton = screen.getByText("删除");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/删除文件失败/)).toBeInTheDocument();
      });
    });
  });

  describe("File-in-Use Warning (AC-3.8.5)", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            files: mockFiles,
            pagination: mockPagination,
          },
        }),
      });
    });

    it("should show file-in-use warning when file is used in articles", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            message: "File is in use",
            code: "FILE_IN_USE",
            inUse: true,
            articleIds: ["article-1", "article-2"],
          },
        }),
      });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
      });

      const confirmButton = screen.getByText("删除");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText("警告")).toBeInTheDocument();
        expect(screen.getByText(/此文件正在被文章使用/)).toBeInTheDocument();
        expect(screen.getByText(/使用此文件的文章数量: 2/)).toBeInTheDocument();
      });
    });

    it("should allow force delete when file is in use", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            error: {
              message: "File is in use",
              code: "FILE_IN_USE",
              inUse: true,
              articleIds: ["article-1"],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: "File deleted successfully",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              files: mockFiles.slice(1),
              pagination: { ...mockPagination, total: 2 },
            },
          }),
        });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
      });

      const confirmButton = screen.getByText("删除");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText("警告")).toBeInTheDocument();
      });

      const forceDeleteButton = screen.getByText("强制删除");
      fireEvent.click(forceDeleteButton);

      await waitFor(() => {
        expect(screen.getByText("文件已强制删除")).toBeInTheDocument();
      });
    });

    it("should cancel force delete when cancel is clicked", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            message: "File is in use",
            code: "FILE_IN_USE",
            inUse: true,
            articleIds: ["article-1"],
          },
        }),
      });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("image1.jpg")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("删除");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
      });

      const confirmButton = screen.getByText("删除");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText("警告")).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("取消");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("警告")).not.toBeInTheDocument();
      });
    });
  });

  describe("Pagination (AC-3.8.1)", () => {
    const manyFiles = Array.from({ length: 25 }, (_, i) => ({
      path: `uploads/file${i + 1}.jpg`,
      name: `file${i + 1}.jpg`,
      size: 102400,
      mimeType: "image/jpeg",
      createdAt: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      url: `/uploads/file${i + 1}.jpg`,
    }));

    it("should display pagination controls when there are multiple pages", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            files: manyFiles.slice(0, 20),
            pagination: {
              page: 1,
              limit: 20,
              total: 25,
              totalPages: 2,
            },
          },
        }),
      });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText(/第 1 页，共 2 页/)).toBeInTheDocument();
      });

      expect(screen.getByText("上一页")).toBeInTheDocument();
      expect(screen.getByText("下一页")).toBeInTheDocument();
    });

    it("should navigate to next page when next button is clicked", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              files: manyFiles.slice(0, 20),
              pagination: {
                page: 1,
                limit: 20,
                total: 25,
                totalPages: 2,
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              files: manyFiles.slice(20),
              pagination: {
                page: 2,
                limit: 20,
                total: 25,
                totalPages: 2,
              },
            },
          }),
        });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText(/第 1 页，共 2 页/)).toBeInTheDocument();
      });

      const nextButton = screen.getByText("下一页");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/第 2 页，共 2 页/)).toBeInTheDocument();
      });
    });

    it("should disable previous button on first page", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            files: manyFiles.slice(0, 20),
            pagination: {
              page: 1,
              limit: 20,
              total: 25,
              totalPages: 2,
            },
          },
        }),
      });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        const prevButton = screen.getByText("上一页");
        expect(prevButton).toBeDisabled();
      });
    });

    it("should disable next button on last page", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            files: manyFiles.slice(20),
            pagination: {
              page: 2,
              limit: 20,
              total: 25,
              totalPages: 2,
            },
          },
        }),
      });

      render(<MediaLibraryPage />);

      await waitFor(() => {
        const nextButton = screen.getByText("下一页");
        expect(nextButton).toBeDisabled();
      });
    });
  });
});

