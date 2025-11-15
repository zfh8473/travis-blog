"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Pagination metadata interface.
 */
export interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Pagination component.
 * 
 * Displays pagination controls with Previous/Next buttons and page numbers.
 * Updates URL query parameters when navigating between pages.
 * 
 * @component
 * @param props - Component props
 * @param props.pagination - Pagination metadata
 * 
 * @example
 * ```tsx
 * <Pagination
 *   pagination={{
 *     page: 1,
 *     limit: 20,
 *     total: 100,
 *     totalPages: 5
 *   }}
 * />
 * ```
 */
export default function Pagination({
  pagination,
}: {
  pagination: PaginationProps;
}) {
  const searchParams = useSearchParams();
  const currentLimit = parseInt(searchParams.get("limit") || "20", 10);

  // Don't render if only one page
  if (pagination.totalPages <= 1) {
    return null;
  }

  /**
   * Build URL with page parameter.
   */
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    if (currentLimit !== 20) {
      params.set("limit", currentLimit.toString());
    }
    return `/?${params.toString()}`;
  };

  /**
   * Determine which page numbers to show.
   */
  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    const { page, totalPages } = pagination;

    // Always show first page
    pages.push(1);

    // Show ellipsis if current page is far from start
    if (page > 3) {
      pages.push("ellipsis");
    }

    // Show pages around current page
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Show ellipsis if current page is far from end
    if (page < totalPages - 2) {
      pages.push("ellipsis");
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
      {/* Previous button */}
      <div>
        {pagination.page > 1 ? (
          <Link
            href={buildPageUrl(pagination.page - 1)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            上一页
          </Link>
        ) : (
          <span className="px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-sm font-medium">
            上一页
          </span>
        )}
      </div>

      {/* Page numbers */}
      <div className="flex gap-2 flex-wrap justify-center">
        {visiblePages.map((pageNum, index) => {
          if (pageNum === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-2 text-gray-400"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = pageNum === pagination.page;

          return (
            <Link
              key={pageNum}
              href={buildPageUrl(pageNum)}
              className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
                isCurrentPage
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 hover:bg-gray-50 text-gray-700"
              }`}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Next button */}
      <div>
        {pagination.page < pagination.totalPages ? (
          <Link
            href={buildPageUrl(pagination.page + 1)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            下一页
          </Link>
        ) : (
          <span className="px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-sm font-medium">
            下一页
          </span>
        )}
      </div>

      {/* Page info */}
      <div className="text-sm text-gray-600">
        第 {pagination.page} 页，共 {pagination.totalPages} 页
      </div>
    </div>
  );
}

