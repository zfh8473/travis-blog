/**
 * Unit tests for article creation form component.
 * 
 * Tests the article creation form including:
 * - Form rendering with all fields
 * - Form validation
 * - Form submission
 * - Error handling
 * - Success navigation
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import NewArticlePage from "@/app/admin/articles/new/page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock TiptapEditor
jest.mock("@/components/editor/TiptapEditor", () => {
  return function MockTiptapEditor({
    onChange,
    placeholder,
  }: {
    onChange?: (content: string) => void;
    placeholder?: string;
  }) {
    return (
      <div data-testid="tiptap-editor">
        <textarea
          data-testid="editor-content"
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe("NewArticlePage", () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: "article-123",
          title: "Test Article",
        },
      }),
    });
  });

  it("should render form with all fields", async () => {
    // Mock categories and tags API
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: "cat-1", name: "技术", slug: "tech" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: "tag-1", name: "React", slug: "react" }],
        }),
      });

    render(<NewArticlePage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("创建文章")).toBeInTheDocument();
    });

    // Check form fields
    expect(screen.getByLabelText(/标题/)).toBeInTheDocument();
    expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
    expect(screen.getByLabelText(/摘要/)).toBeInTheDocument();
    expect(screen.getByLabelText(/分类/)).toBeInTheDocument();
    expect(screen.getByText(/标签/)).toBeInTheDocument();
    expect(screen.getByText("草稿")).toBeInTheDocument();
    expect(screen.getByText("已发布")).toBeInTheDocument();
  });

  it("should validate required fields", async () => {
    // Mock categories and tags API
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(<NewArticlePage />);

    await waitFor(() => {
      expect(screen.getByText("创建文章")).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByText("保存为草稿");
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/标题不能为空/)).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    // Mock categories and tags API
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(<NewArticlePage />);

    await waitFor(() => {
      expect(screen.getByText("创建文章")).toBeInTheDocument();
    });

    // Fill form
    const titleInput = screen.getByLabelText(/标题/);
    fireEvent.change(titleInput, { target: { value: "Test Article" } });

    const contentEditor = screen.getByTestId("editor-content");
    fireEvent.change(contentEditor, { target: { value: "<p>Test content</p>" } });

    // Mock article creation API for the submit call
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: {
          id: "article-123",
          title: "Test Article",
        },
      }),
    });

    // Submit form
    const submitButton = screen.getByText("保存为草稿");
    fireEvent.click(submitButton);

    // Should call API and redirect
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith("/api/articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Test Article",
            content: "<p>Test content</p>",
            status: "DRAFT",
          }),
        });
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/admin/articles/article-123");
      },
      { timeout: 3000 }
    );
  });

  it("should handle API errors", async () => {
    // Mock categories and tags API
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(<NewArticlePage />);

    await waitFor(() => {
      expect(screen.getByText("创建文章")).toBeInTheDocument();
    });

    // Fill form
    const titleInput = screen.getByLabelText(/标题/);
    fireEvent.change(titleInput, { target: { value: "Test Article" } });

    const contentEditor = screen.getByTestId("editor-content");
    fireEvent.change(contentEditor, { target: { value: "<p>Test content</p>" } });

    // Mock article creation API error for the submit call
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          message: "Invalid input data",
          code: "VALIDATION_ERROR",
        },
      }),
    });

    // Submit form
    const submitButton = screen.getByText("保存为草稿");
    fireEvent.click(submitButton);

    // Should show error message
    await waitFor(
      () => {
        expect(screen.getByText(/创建文章失败|Invalid input data/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should handle tag selection", async () => {
    // Mock categories and tags API
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: "tag-1", name: "React", slug: "react" },
            { id: "tag-2", name: "Next.js", slug: "nextjs" },
          ],
        }),
      });

    render(<NewArticlePage />);

    await waitFor(() => {
      expect(screen.getByText("React")).toBeInTheDocument();
    });

    // Select a tag
    const reactCheckbox = screen.getByLabelText(/React/);
    fireEvent.click(reactCheckbox);

    // Tag should be selected
    expect(reactCheckbox).toBeChecked();
  });
});

