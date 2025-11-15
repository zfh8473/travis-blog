import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import ArticleList from "@/components/article/ArticleList";
import Pagination from "@/components/article/Pagination";

/**
 * Article response interface.
 */
interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  status: "PUBLISHED";
  categoryId: string | null;
  authorId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

/**
 * Pagination metadata interface.
 */
interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Category interface.
 */
interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Fetch category by slug from database.
 * 
 * @param slug - Category slug
 * @returns Category object or null if not found
 */
async function fetchCategoryBySlug(
  slug: string
): Promise<Category | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return category;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw new Error("Failed to fetch category from database");
  }
}

/**
 * Fetch articles by category slug from database.
 * 
 * @param categorySlug - Category slug
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Articles and pagination data
 */
async function fetchArticlesByCategory(
  categorySlug: string,
  page: number = 1,
  limit: number = 20
): Promise<{ articles: Article[]; pagination: PaginationData }> {
  try {
    // Find category by slug first
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });

    // Category not found
    if (!category) {
      return {
        articles: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const skip = (page - 1) * limit;
    const take = Math.min(100, Math.max(1, limit));

    // Build where clause - only published articles in this category
    const where = {
      status: "PUBLISHED" as const,
      categoryId: category.id,
    };

    // Get total count for pagination
    const total = await prisma.article.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / take);

    // Query articles from database
    const articles = await prisma.article.findMany({
      where,
      skip,
      take,
      orderBy: {
        publishedAt: "desc", // Sort by publish date, newest first
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Transform tags to simple array format
    // Type assertion is safe because we filter for PUBLISHED status in where clause
    const transformedArticles: Article[] = articles.map((article) => ({
      ...article,
      status: "PUBLISHED" as const, // Explicitly set status since we filtered for PUBLISHED
      publishedAt: article.publishedAt?.toISOString() || null,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      tags: article.tags.map((at) => at.tag),
    }));

    return {
      articles: transformedArticles,
      pagination: {
        page,
        limit: take,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw new Error("Failed to fetch articles from database");
  }
}

/**
 * Generate metadata for category page.
 * 
 * @param params - Route parameters
 * @returns Metadata object
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    return {
      title: "分类不存在",
      description: "您访问的分类不存在",
    };
  }

  const description = `${category.name}分类下的所有文章 - Travis 的博客`;

  return {
    title: `${category.name}分类文章`,
    description,
    openGraph: {
      title: `${category.name}分类文章`,
      description,
      type: "website",
    },
  };
}

/**
 * Loading component for Suspense boundary.
 */
function CategoryPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-6 bg-white"
          >
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Category page content component.
 * 
 * Fetches and displays articles filtered by category.
 * 
 * @component
 */
async function CategoryPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(resolvedSearchParams.limit || "20", 10)));

  try {
    // Fetch category and articles
    const [category, { articles, pagination }] = await Promise.all([
      fetchCategoryBySlug(slug),
      fetchArticlesByCategory(slug, page, limit),
    ]);

    // Category not found
    if (!category) {
      notFound();
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{category.name}分类</h1>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
            >
              查看全部文章 →
            </Link>
          </div>
          <p className="text-gray-600">
            {pagination.total > 0
              ? `共找到 ${pagination.total} 篇文章`
              : "暂无文章"}
          </p>
        </header>

        {/* Article list */}
        <ArticleList articles={articles} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Suspense fallback={<div className="mt-8 text-center text-gray-500">加载分页...</div>}>
            <CategoryPagination pagination={pagination} categorySlug={slug} />
          </Suspense>
        )}
      </div>
    );
  } catch (error) {
    // Error state
    console.error("Category page error:", error);
    throw error; // Re-throw to trigger error boundary
  }
}

/**
 * Category pagination component.
 * 
 * Wraps Pagination component to use category URL format.
 * 
 * @component
 */
function CategoryPagination({
  pagination,
  categorySlug,
}: {
  pagination: PaginationData;
  categorySlug: string;
}) {
  // Build URL with category slug and page parameter
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    return `/articles/category/${categorySlug}?${params.toString()}`;
  };

  // Don't render if only one page
  if (pagination.totalPages <= 1) {
    return null;
  }

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

/**
 * Category page component.
 * 
 * Displays articles filtered by category slug.
 * Uses Server Component for SSR and SEO optimization.
 * 
 * @component
 * @route /articles/category/[slug]
 * @requires Public access
 * 
 * @example
 * User clicks category link, sees filtered articles for that category
 */
export default function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  return (
    <Suspense fallback={<CategoryPageLoading />}>
      <CategoryPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
