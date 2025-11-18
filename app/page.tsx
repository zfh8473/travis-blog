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
    let orderBy: any = {
      publishedAt: "desc", // Default: newest first
    };

    if (sort === "最热") {
      // For "最热", we'll use publishedAt desc as a proxy (can be enhanced with view count later)
      orderBy = { publishedAt: "desc" };
    } else if (sort === "最多评论") {
      // For "最多评论", we'll use publishedAt desc as a proxy (can be enhanced with comment count later)
      orderBy = { publishedAt: "desc" };
    } else {
      // "最新" or default
      orderBy = { publishedAt: "desc" };
    }

    // Get total count for pagination
    const total = await prisma.article.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / take);

    // Query articles from database
    const articles = await prisma.article.findMany({
      where,
      skip,
      take,
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
      },
    });

    // Transform tags to simple array format
    // Type assertion is safe because we filter for PUBLISHED status in where clause
    // Note: views field may not exist if migration hasn't run yet, use optional chaining
    const transformedArticles: Article[] = articles.map((article) => ({
      ...article,
      status: "PUBLISHED" as const, // Explicitly set status since we filtered for PUBLISHED
      publishedAt: article.publishedAt?.toISOString() || null,
      views: (article as any).views ?? 0, // Use type assertion and nullish coalescing for migration compatibility
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
export default function Home({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string };
}) {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent searchParams={searchParams} />
    </Suspense>
  );
}
