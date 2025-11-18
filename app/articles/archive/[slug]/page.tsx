import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import ArticleList from "@/components/article/ArticleList";
import Pagination from "@/components/article/Pagination";
import Sidebar from "@/components/layout/Sidebar";
import { format, parse } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * Article interface for list display.
 */
interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  publishedAt: string | null;
  views: number;
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
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

/**
 * Pagination data interface.
 */
interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Fetch articles by archive month.
 * 
 * @param monthSlug - Month slug in format "yyyy-MM" (e.g., "2025-11")
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20, max: 100)
 * @returns Promise resolving to articles and pagination data
 */
async function fetchArticlesByMonth(
  monthSlug: string,
  page: number = 1,
  limit: number = 20
): Promise<{ articles: Article[]; pagination: PaginationData }> {
  try {
    // Parse month slug (format: "yyyy-MM")
    let startDate: Date;
    let endDate: Date;
    
    try {
      const parsedDate = parse(monthSlug, "yyyy-MM", new Date());
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format");
      }
      
      // Set start of month
      startDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      
      // Set end of month
      endDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } catch (error) {
      // Invalid month format
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

    // Build where clause - only published articles in the specified month
    const where = {
      status: "PUBLISHED" as const,
      publishedAt: {
        gte: startDate,
        lte: endDate,
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
        publishedAt: "desc",
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

    // Transform articles to match Article interface
    const transformedArticles: Article[] = articles.map((article) => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      slug: article.slug,
      publishedAt: article.publishedAt?.toISOString() || null,
      views: article.views,
      category: article.category
        ? {
            id: article.category.id,
            name: article.category.name,
            slug: article.category.slug,
          }
        : null,
      tags: article.tags.map((at) => ({
        id: at.tag.id,
        name: at.tag.name,
        slug: at.tag.slug,
      })),
      author: {
        id: article.author.id,
        name: article.author.name,
        image: article.author.image,
      },
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
    console.error("Error fetching articles by month:", error);
    throw new Error("Failed to fetch articles from database");
  }
}

/**
 * Archive page loading component.
 */
function ArchivePageLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}

/**
 * Archive page content component.
 * 
 * Displays articles published in a specific month.
 * 
 * @component
 */
async function ArchivePageContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam, limit: limitParam } = await searchParams;

  if (!slug) {
    notFound();
  }

  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(limitParam || "20", 10)));

  try {
    const { articles, pagination } = await fetchArticlesByMonth(slug, page, limit);

    // Format month label for display
    let monthLabel = slug;
    try {
      const parsedDate = parse(slug, "yyyy-MM", new Date());
      if (!isNaN(parsedDate.getTime())) {
        monthLabel = format(parsedDate, "yyyy年MM月", { locale: zhCN });
      }
    } catch {
      // Use slug as fallback
    }

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div>
            {/* Page header */}
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {monthLabel} 归档
              </h1>
              <p className="text-slate-600">
                {pagination.total > 0
                  ? `共找到 ${pagination.total} 篇文章`
                  : "暂无文章"}
              </p>
            </header>

            {/* Article list */}
            {articles.length > 0 ? (
              <>
                <ArticleList articles={articles} />

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <Suspense fallback={<div className="mt-8 text-center text-slate-500">加载分页...</div>}>
                    <Pagination pagination={pagination} />
                  </Suspense>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">该月份暂无文章</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ArchivePageContent:", error);
    notFound();
  }
}

/**
 * Archive page.
 * 
 * Displays articles published in a specific month.
 * 
 * @component
 * @route /articles/archive/[slug]
 * @requires Public access
 */
export default function ArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  return (
    <Suspense fallback={<ArchivePageLoading />}>
      <ArchivePageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

