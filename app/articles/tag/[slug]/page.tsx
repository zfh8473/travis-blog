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
 * Tag interface.
 */
interface Tag {
  id: string;
  name: string;
  slug: string;
}

/**
 * Fetch tag by slug from database.
 * 
 * @param slug - Tag slug
 * @returns Tag object or null if not found
 */
async function fetchTagBySlug(
  slug: string
): Promise<Tag | null> {
  try {
    const tag = await prisma.tag.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return tag;
  } catch (error) {
    console.error("Error fetching tag:", error);
    throw new Error("Failed to fetch tag from database");
  }
}

/**
 * Fetch articles by tag slug from database.
 * 
 * @param tagSlug - Tag slug
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Articles and pagination data
 */
async function fetchArticlesByTag(
  tagSlug: string,
  page: number = 1,
  limit: number = 20
): Promise<{ articles: Article[]; pagination: PaginationData }> {
  try {
    // Find tag by slug first
    const tag = await prisma.tag.findUnique({
      where: { slug: tagSlug },
      select: { id: true },
    });

    // Tag not found
    if (!tag) {
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

    // Build where clause - only published articles with this tag
    // Use Prisma relation filter for many-to-many relationship
    const where = {
      status: "PUBLISHED" as const,
      tags: {
        some: {
          tagId: tag.id,
        },
      },
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
 * Generate metadata for tag page.
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
  const tag = await fetchTagBySlug(slug);

  if (!tag) {
    return {
      title: "标签不存在",
      description: "您访问的标签不存在",
    };
  }

  const description = `${tag.name}标签下的所有文章 - Travis 的博客`;

  return {
    title: `${tag.name}标签文章`,
    description,
    openGraph: {
      title: `${tag.name}标签文章`,
      description,
      type: "website",
    },
  };
}

/**
 * Loading component for Suspense boundary.
 */
function TagPageLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
      <div className="mb-8">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 mb-6">
          <div className="h-10 bg-slate-200 rounded w-48 mb-2 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6"
          >
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-3 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-full mb-2 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-4 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Tag page content component.
 * 
 * Fetches and displays articles filtered by tag.
 * 
 * @component
 */
async function TagPageContent({
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
    // Fetch tag and articles
    const [tag, { articles, pagination }] = await Promise.all([
      fetchTagBySlug(slug),
      fetchArticlesByTag(slug, page, limit),
    ]);

    // Tag not found
    if (!tag) {
      notFound();
    }

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
        {/* Page header */}
        <header className="mb-8">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏷️</span>
                <h1 className="text-4xl font-bold text-slate-900">{tag.name}标签</h1>
              </div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
            >
              查看全部文章 →
            </Link>
          </div>
            <p className="text-slate-600">
            {pagination.total > 0
              ? `共找到 ${pagination.total} 篇文章`
              : "暂无文章"}
          </p>
          </div>
        </header>

        {/* Article list */}
        <ArticleList articles={articles} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Suspense fallback={<div className="mt-8 text-center text-slate-500">加载分页...</div>}>
            <TagPagination pagination={pagination} tagSlug={slug} />
          </Suspense>
        )}
      </div>
    );
  } catch (error) {
    // Error state
    console.error("Tag page error:", error);
    throw error; // Re-throw to trigger error boundary
  }
}

/**
 * Tag pagination component.
 * 
 * Wraps Pagination component to use tag URL format.
 * 
 * @component
 */
function TagPagination({
  pagination,
  tagSlug,
}: {
  pagination: PaginationData;
  tagSlug: string;
}) {
  // Build URL with tag slug and page parameter
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    return `/articles/tag/${tagSlug}?${params.toString()}`;
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
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
          >
            上一页
          </Link>
        ) : (
          <span className="px-4 py-2 border border-slate-300 rounded-lg text-slate-400 cursor-not-allowed text-sm font-medium">
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
                className="px-2 py-2 text-slate-400"
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
                  : "border-slate-300 hover:bg-slate-50 text-slate-700"
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
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
          >
            下一页
          </Link>
        ) : (
          <span className="px-4 py-2 border border-slate-300 rounded-lg text-slate-400 cursor-not-allowed text-sm font-medium">
            下一页
          </span>
        )}
      </div>

      {/* Page info */}
      <div className="text-sm text-slate-600">
        第 {pagination.page} 页，共 {pagination.totalPages} 页
      </div>
    </div>
  );
}

/**
 * Tag page component.
 * 
 * Displays articles filtered by tag slug.
 * Uses Server Component for SSR and SEO optimization.
 * 
 * @component
 * @route /articles/tag/[slug]
 * @requires Public access
 * 
 * @example
 * User clicks tag link, sees filtered articles for that tag
 */
export default function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  return (
    <Suspense fallback={<TagPageLoading />}>
      <TagPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
