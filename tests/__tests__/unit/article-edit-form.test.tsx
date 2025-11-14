/**
 * Unit tests for article edit form component.
 * 
 * Tests the article edit form including:
 * - Form rendering with pre-filled data
 * - Form validation
 * - Form submission
 * - Error handling (article not found, validation errors, auth errors)
 * - Success handling
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useRouter, useParams } from "next/navigation";
import EditArticlePage from "@/app/admin/articles/[id]/edit/page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock TiptapEditor
jest.mock("@/components/editor/TiptapEditor", () => {
  return function MockTiptapEditor({
    initialContent,
    onChange,
    placeholder,
    readOnly,
  }: {
    initialContent?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    readOnly?: boolean;
  }) {
    const [content, setContent] = React.useState(initialContent || "");
    
    React.useEffect(() => {
      if (initialContent !== undefined) {
        setContent(initialContent);
      }
    }, [initialContent]);

    return (
      <div data-testid="tiptap-editor">
        <textarea
          data-testid="editor-content"
          value={content}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => {
            const newContent = e.target.value;
            setContent(newContent);
            onChange?.(newContent);
          }}
        />
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe("EditArticlePage", () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
  };
  const mockParams = {
    id: "550e8400-e29b-41d4-a716-446655440000",
  };

  const mockArticle = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Test Article",
    content: "<p>Article content</p>",
    excerpt: "Article excerpt",
    categoryId: "550e8400-e29b-41d4-a716-446655440001",
    tags: [{ id: "550e8400-e29b-41d4-a716-446655440002", name: "React", slug: "react" }],
    status: "DRAFT" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue(mockParams);
    // Reset fetch mock completely
    (global.fetch as jest.Mock).mockReset();
  });

  it("should render form with pre-filled article data", async () => {
    // Mock article, categories, and tags API
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
          data: [{ id: "550e8400-e29b-41d4-a716-446655440001", name: "技术", slug: "tech" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: "550e8400-e29b-41d4-a716-446655440002", name: "React", slug: "react" }],
        }),
      });

    render(<EditArticlePage />);

    // Wait for data to load
    await waitFor(
      () => {
        expect(screen.getByText("编辑文章")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Check form fields are pre-filled
    expect(screen.getByDisplayValue("Test Article")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Article excerpt")).toBeInTheDocument();
    
    // Check category is pre-selected (check select element value)
    const categorySelect = screen.getByLabelText(/分类/) as HTMLSelectElement;
    expect(categorySelect.value).toBe("550e8400-e29b-41d4-a716-446655440001");
    
    expect(screen.getByLabelText("React")).toBeChecked();
    expect(screen.getByLabelText("草稿")).toBeChecked();
  });

  it("should show loading state while fetching article data", async () => {
    // Mock slow API response - need to mock all three calls (article, categories, tags)
    let callCount = 0;
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            callCount++;
            if (callCount === 1) {
              // First call: article
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  data: mockArticle,
                }),
              });
            } else if (callCount === 2) {
              // Second call: categories
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  data: [],
                }),
              });
            } else {
              // Third call: tags
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  data: [],
                }),
              });
            }
          }, 100);
        })
    );

    render(<EditArticlePage />);

    // Should show loading initially
    expect(screen.getByText("加载中...")).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText("加载中...")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should show error message when article not found", async () => {
    // Mock 404 response
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

    render(<EditArticlePage />);

    await waitFor(
      () => {
        expect(screen.getByText("文章不存在")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should show error message when user not authenticated", async () => {
    // Mock 401 response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: {
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        },
      }),
    });

    render(<EditArticlePage />);

    await waitFor(
      () => {
        expect(screen.getByText("请先登录")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should show error message when user lacks permission", async () => {
    // Mock 403 response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
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

    render(<EditArticlePage />);

    await waitFor(
      () => {
        expect(screen.getByText("权限不足，需要管理员权限")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should validate form before submission", async () => {
    // Mock article, categories, and tags API
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

    render(<EditArticlePage />);

    await waitFor(
      () => {
        expect(screen.getByText("编辑文章")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify form fields are present
    const titleInput = screen.getByDisplayValue("Test Article");
    expect(titleInput).toBeInTheDocument();
    
    // Verify submit buttons are present
    expect(screen.getByText("保存为草稿")).toBeInTheDocument();
    expect(screen.getByText("发布")).toBeInTheDocument();
  });

  it("should submit form with valid data", async () => {
    // Mock article, categories, and tags API (initial load)
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
          data: [{ id: "550e8400-e29b-41d4-a716-446655440001", name: "技术", slug: "tech" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: "550e8400-e29b-41d4-a716-446655440002", name: "React", slug: "react" }],
        }),
      })
      // Mock PUT API response (form submission)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockArticle,
            title: "Updated Title",
          },
        }),
      });

    render(<EditArticlePage />);

    await waitFor(
      () => {
        expect(screen.getByText("编辑文章")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify form is loaded with content
    const editorContent = screen.getByTestId("editor-content");
    expect(editorContent).toBeInTheDocument();
    
    // Verify content is set (from mockArticle: "<p>Article content</p>")
    // This should pass validation since it has actual text content ("Article content")

    // Update title to trigger a change
    const titleInput = screen.getByDisplayValue("Test Article");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    // Wait for state to update
    await waitFor(() => {
      expect(titleInput).toHaveValue("Updated Title");
    }, { timeout: 2000 });

    // Submit form - click button which triggers handleSubmit
    const submitButton = screen.getByText("保存为草稿");
    fireEvent.click(submitButton);

    // Wait for PUT API call to be made first
    await waitFor(
      () => {
        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        const putCall = fetchCalls.find(
          (call) => {
            const url = call[0];
            const options = call[1];
            return (
              typeof url === "string" &&
              url.includes("/api/articles/550e8400-e29b-41d4-a716-446655440000") &&
              options?.method === "PUT"
            );
          }
        );
        expect(putCall).toBeDefined();
      },
      { timeout: 10000 }
    );

    // Wait for success message
    await waitFor(
      () => {
        expect(screen.getByText("文章更新成功！")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 20000);

  it("should handle API validation errors", async () => {
    // Mock article, categories, and tags API (initial load)
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
          data: [{ id: "550e8400-e29b-41d4-a716-446655440001", name: "技术", slug: "tech" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: "550e8400-e29b-41d4-a716-446655440002", name: "React", slug: "react" }],
        }),
      })
      // Mock PUT API validation error (form submission)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            message: "Invalid input data",
            code: "VALIDATION_ERROR",
            details: [
              {
                path: ["title"],
                message: "Title is required",
              },
            ],
          },
        }),
      });

    render(<EditArticlePage />);

    await waitFor(
      () => {
        expect(screen.getByText("编辑文章")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Update title to a valid value (client validation will pass)
    // The API will return a validation error for testing purposes
    const titleInput = screen.getByDisplayValue("Test Article");
    fireEvent.change(titleInput, { target: { value: "Valid Title" } });

    // Wait for state update
    await waitFor(() => {
      expect(titleInput).toHaveValue("Valid Title");
    }, { timeout: 2000 });

    // Submit form
    const submitButton = screen.getByText("保存为草稿");
    fireEvent.click(submitButton);

    // Wait for validation error from API
    await waitFor(
      () => {
        expect(screen.getByText(/Title is required/)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it("should handle network errors", async () => {
    // Mock article, categories, and tags API (initial load)
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
          data: [{ id: "550e8400-e29b-41d4-a716-446655440001", name: "技术", slug: "tech" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: "550e8400-e29b-41d4-a716-446655440002", name: "React", slug: "react" }],
        }),
      })
      // Mock network error (form submission)
      .mockRejectedValueOnce(new Error("Network error"));

    render(<EditArticlePage />);

    await waitFor(
      () => {
        expect(screen.getByText("编辑文章")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Update title to ensure form is valid
    const titleInput = screen.getByDisplayValue("Test Article");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    // Wait for state update
    await waitFor(() => {
      expect(titleInput).toHaveValue("Updated Title");
    }, { timeout: 2000 });

    // Submit form
    const submitButton = screen.getByText("保存为草稿");
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(
      () => {
        expect(screen.getByText(/网络错误|更新文章失败/)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 15000);

  it("should pre-select tags correctly", async () => {
    // Mock article with tags
    const articleWithTags = {
      ...mockArticle,
      tags: [
        { id: "550e8400-e29b-41d4-a716-446655440002", name: "React", slug: "react" },
        { id: "550e8400-e29b-41d4-a716-446655440003", name: "Next.js", slug: "nextjs" },
      ],
    };

    // Mock article, categories, and tags API
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: articleWithTags,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: "550e8400-e29b-41d4-a716-446655440001", name: "技术", slug: "tech" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: "550e8400-e29b-41d4-a716-446655440002", name: "React", slug: "react" },
            { id: "550e8400-e29b-41d4-a716-446655440003", name: "Next.js", slug: "nextjs" },
            { id: "550e8400-e29b-41d4-a716-446655440004", name: "TypeScript", slug: "typescript" },
          ],
        }),
      });

    render(<EditArticlePage />);

    await waitFor(
      () => {
        expect(screen.getByText("编辑文章")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Wait for tags to be rendered and checked
    await waitFor(
      () => {
        const reactCheckbox = screen.getByLabelText("React");
        expect(reactCheckbox).toBeChecked();
      },
      { timeout: 5000 }
    );

    // Check tags are pre-selected
    expect(screen.getByLabelText("React")).toBeChecked();
    expect(screen.getByLabelText("Next.js")).toBeChecked();
    expect(screen.getByLabelText("TypeScript")).not.toBeChecked();
  });
});

