/**
 * Unit tests for Admin Article Navigation.
 * 
 * Tests the "Back to Articles List" navigation link on article creation and edit pages.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useParams: jest.fn(() => ({ id: "article-123" })),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe("Admin Article Navigation", () => {
  describe("Article Creation Page", () => {
    it("should render 'Back to Articles List' link", async () => {
      // Import the component dynamically to avoid issues with hooks
      const NewArticlePage = (await import("@/app/admin/articles/new/page")).default;
      
      // Mock fetch for categories and tags
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      render(<NewArticlePage />);

      // Wait for component to load using waitFor for more reliable testing
      const backLink = await waitFor(
        () => screen.getByText("← 返回文章列表"),
        { timeout: 3000 }
      );
      
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest("a")).toHaveAttribute("href", "/admin/articles");
    });
  });

  describe("Article Edit Page", () => {
    it("should render 'Back to Articles List' link", async () => {
      // Import the component dynamically
      const EditArticlePage = (await import("@/app/admin/articles/[id]/edit/page")).default;
      
      // Mock fetch for article, categories, and tags
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: "article-123",
              title: "Test Article",
              content: "<p>Content</p>",
              excerpt: null,
              categoryId: null,
              tags: [],
              status: "DRAFT",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });

      render(<EditArticlePage />);

      // Wait for component to load using waitFor for more reliable testing
      const backLink = await waitFor(
        () => screen.getByText("← 返回文章列表"),
        { timeout: 3000 }
      );
      
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest("a")).toHaveAttribute("href", "/admin/articles");
    });
  });
});

