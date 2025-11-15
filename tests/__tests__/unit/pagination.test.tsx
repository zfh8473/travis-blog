/**
 * Unit tests for Pagination component.
 * 
 * Tests pagination controls, page navigation, and edge cases.
 */

import { render, screen } from "@testing-library/react";
import Pagination from "@/components/article/Pagination";

// Mock Next.js navigation
const mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe("Pagination Component", () => {
  const mockPagination = {
    page: 2,
    limit: 20,
    total: 100,
    totalPages: 5,
  };

  beforeEach(() => {
    mockSearchParams.delete("page");
    mockSearchParams.delete("limit");
  });

  describe("AC-4.1.4: Display pagination controls", () => {
    it("should display current page and total pages", () => {
      render(<Pagination pagination={mockPagination} />);
      expect(screen.getByText("第 2 页，共 5 页")).toBeInTheDocument();
    });

    it("should display Previous and Next buttons", () => {
      render(<Pagination pagination={mockPagination} />);
      expect(screen.getByText("上一页")).toBeInTheDocument();
      expect(screen.getByText("下一页")).toBeInTheDocument();
    });

    it("should display page number buttons", () => {
      render(<Pagination pagination={mockPagination} />);
      // Should show page 1, 2 (current), 3, and 5 (last)
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should not render when only one page", () => {
      const singlePage = {
        page: 1,
        limit: 20,
        total: 10,
        totalPages: 1,
      };
      const { container } = render(<Pagination pagination={singlePage} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("AC-4.1.4: Handle edge cases", () => {
    it("should disable Previous button on first page", () => {
      const firstPage = {
        ...mockPagination,
        page: 1,
      };
      render(<Pagination pagination={firstPage} />);
      const prevButton = screen.getByText("上一页");
      expect(prevButton).toHaveClass("cursor-not-allowed");
    });

    it("should disable Next button on last page", () => {
      const lastPage = {
        ...mockPagination,
        page: 5,
      };
      render(<Pagination pagination={lastPage} />);
      const nextButton = screen.getByText("下一页");
      expect(nextButton).toHaveClass("cursor-not-allowed");
    });

    it("should show ellipsis for many pages", () => {
      const manyPages = {
        page: 5,
        limit: 20,
        total: 200,
        totalPages: 10,
      };
      render(<Pagination pagination={manyPages} />);
      const ellipsis = screen.getAllByText("...");
      expect(ellipsis.length).toBeGreaterThan(0);
    });
  });

  describe("AC-4.1.4: URL parameter handling", () => {
    it("should build correct URL with page parameter", () => {
      render(<Pagination pagination={mockPagination} />);
      const nextLink = screen.getByText("下一页").closest("a");
      expect(nextLink).toHaveAttribute("href", expect.stringContaining("page=3"));
    });

    it("should preserve limit parameter in URL", () => {
      mockSearchParams.set("limit", "50");
      render(<Pagination pagination={{ ...mockPagination, limit: 50 }} />);
      const nextLink = screen.getByText("下一页").closest("a");
      expect(nextLink).toHaveAttribute("href", expect.stringContaining("limit=50"));
    });
  });

  describe("AC-4.1.5: Responsive design", () => {
    it("should have responsive flex layout", () => {
      const { container } = render(<Pagination pagination={mockPagination} />);
      const pagination = container.firstChild;
      expect(pagination).toHaveClass("flex-col", "sm:flex-row");
    });
  });
});

