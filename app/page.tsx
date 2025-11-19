import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import ArticleList from "@/components/article/ArticleList";
import Pagination from "@/components/article/Pagination";
import Sidebar from "@/components/layout/Sidebar";
import ArticleFiltersWrapper from "@/components/article/ArticleFiltersWrapper";

/**
 * Article response interface from API.
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
  views: number; // Article view count
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
 * API response interface.
 */
interface ArticlesResponse {
  success: boolean;
  data?: {
    articles: Article[];
    pagination: PaginationData;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Fetch published articles directly from database.
 * 
 * In Server Components, we can directly use Prisma for better performance
 * instead of making HTTP requests to API routes.
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20, max: 100)
 * @returns Promise resolving to articles and pagination data
 * @throws Error if database query fails
 */
async function fetchArticles(
  page: number = 1,
  limit: number = 20,
  category?: string,
  sort?: string
): Promise<{ articles: Article[]; pagination: PaginationData }> {
  try {
    // Debug: Log the sort parameter
    console.log("[fetchArticles] sort parameter:", sort, "type:", typeof sort);
    
    const skip = (page - 1) * limit;
    const take = Math.min(100, Math.max(1, limit));

    // Build where clause - only published articles
    const where: any = {
      status: "PUBLISHED" as const,
    };

    // Add category filter if specified
    if (category && category !== "全部") {
      where.category = {
        name: category,
      };
    }

    // Determine sort order
    // For "最多评论" and "最热", we need to fetch all articles first, then sort in memory
    // because Prisma doesn't support ordering by relation count directly in a single query
    let orderBy: any = {
      publishedAt: "desc", // Default: newest first
    };
    let needInMemorySort = false;
    let sortType: "comments" | "views" | null = null;

    // Normalize sort parameter (handle URL encoding)
    const normalizedSort = sort?.trim() || "";
    console.log("[fetchArticles] sort parameter:", sort, "type:", typeof sort);
    console.log("[fetchArticles] normalizedSort:", normalizedSort);

    if (normalizedSort === "最早") {
      // Sort by publishedAt ascending (oldest first)
      orderBy = { publishedAt: "asc" };
      console.log("[fetchArticles] Using sort: 最早 (publishedAt asc)");
    } else if (normalizedSort === "最热") {
      // Sort by views descending (most viewed first)
      orderBy = { views: "desc" };
      console.log("[fetchArticles] Using sort: 最热 (views desc)");
    } else if (normalizedSort === "最多评论") {
      // Need to sort by comment count - fetch all and sort in memory
      needInMemorySort = true;
      sortType = "comments";
      // Use publishedAt as initial sort, will re-sort after fetching
      orderBy = { publishedAt: "desc" };
      console.log("[fetchArticles] Using sort: 最多评论 (comments desc, in-memory)");
    } else {
      // "最新" or default - sort by publishedAt descending (newest first)
      orderBy = { publishedAt: "desc" };
      console.log("[fetchArticles] Using sort: 最新 or default (publishedAt desc)");
    }

    // Get total count for pagination
    const total = await prisma.article.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / take);

    // Query articles from database
    // If we need to sort by comment count, fetch more articles than needed
    // to ensure we get the correct top N after sorting
    const fetchLimit = needInMemorySort ? Math.min(total, 100) : take;
    
    // Debug: Log the orderBy object
    console.log("[fetchArticles] orderBy:", JSON.stringify(orderBy));
    console.log("[fetchArticles] needInMemorySort:", needInMemorySort);
    console.log("[fetchArticles] sortType:", sortType);
    
    const articles = await prisma.article.findMany({
      where,
      skip: needInMemorySort ? 0 : skip, // Fetch from beginning if sorting in memory
      take: needInMemorySort ? fetchLimit : take,
      orderBy,
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
        _count: {
          select: {
            comments: true, // Include comment count for sorting
          },
        },
      },
    });
    
    // Debug: Log the first few articles after query
    console.log("[fetchArticles] Articles after query (first 3):", articles.slice(0, 3).map(a => ({
      title: a.title,
      views: (a as any).views,
      publishedAt: a.publishedAt,
      commentCount: a._count?.comments || 0
    })));

    // Sort in memory if needed (for comment count)
    let sortedArticles = articles;
    if (needInMemorySort && sortType === "comments") {
      console.log("[fetchArticles] Sorting by comment count in memory. Articles before sort:", articles.length);
      sortedArticles = articles.sort((a, b) => {
        const aCount = a._count?.comments || 0;
        const bCount = b._count?.comments || 0;
        console.log(`[fetchArticles] Comparing: ${a.title} (${aCount} comments) vs ${b.title} (${bCount} comments)`);
        return bCount - aCount; // Descending order (most comments first)
      });
      console.log("[fetchArticles] Articles after sort:", sortedArticles.map(a => ({ title: a.title, comments: a._count?.comments || 0 })));
      // Apply pagination after sorting
      sortedArticles = sortedArticles.slice(skip, skip + take);
      console.log("[fetchArticles] Articles after pagination:", sortedArticles.length);
    }

    // Transform tags to simple array format
    // Type assertion is safe because we filter for PUBLISHED status in where clause
    // Note: views field may not exist if migration hasn't run yet, use optional chaining
    const transformedArticles: Article[] = sortedArticles.map((article) => {
      // Remove _count from the article object as it's not part of the Article interface
      const { _count, ...articleWithoutCount } = article;
      return {
        ...articleWithoutCount,
        status: "PUBLISHED" as const, // Explicitly set status since we filtered for PUBLISHED
        publishedAt: article.publishedAt?.toISOString() || null,
        views: (article as any).views ?? 0, // Use type assertion and nullish coalescing for migration compatibility
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        tags: article.tags.map((at) => at.tag),
      };
    });

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
 * Homepage content component.
 * 
 * Fetches and displays published articles with pagination.
 * 
 * @component
 */
async function HomePageContent({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; category?: string; sort?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.limit || "20", 10)));
  const category = searchParams.category || "全部";
  const sort = searchParams.sort || "最新";

  // Debug: Log searchParams
  console.log("[HomePageContent] searchParams:", searchParams);
  console.log("[HomePageContent] sort value:", sort, "type:", typeof sort);

  try {
    const { articles, pagination } = await fetchArticles(page, limit, category, sort);

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div>
            {/* Page header with filters */}
            <header className="mb-8">
              <ArticleFiltersWrapper />
              <p className="text-slate-600 mt-2">
                {pagination.total > 0
                  ? `共找到 ${pagination.total} 篇文章`
                  : "暂无文章"}
              </p>
            </header>

            {/* Article list */}
            <ArticleList articles={articles} />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Suspense fallback={<div className="mt-8 text-center text-slate-500">加载分页...</div>}>
                <Pagination pagination={pagination} />
              </Suspense>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    );
  } catch (error) {
    // Error state
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">加载文章失败</h2>
          <p className="text-sm">
            {error instanceof Error
              ? error.message
              : "无法加载文章列表，请稍后重试"}
          </p>
        </div>
      </div>
    );
  }
}

/**
 * Loading component for Suspense boundary.
 */
function HomePageLoading() {
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
 * Homepage component.
 * 
 * Displays a list of published articles on the homepage.
 * Uses Server Component for SSR and SEO optimization.
 * 
 * @component
 * @route /
 * @requires Public access
 * 
 * @example
 * User visits homepage, sees list of published articles with pagination
 */
// Force dynamic rendering to ensure searchParams changes trigger re-renders
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; category?: string; sort?: string };
}) {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent searchParams={searchParams} />
    </Suspense>
  );
}
