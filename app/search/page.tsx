import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import ArticleList from "@/components/article/ArticleList";
import type { ArticleCardProps } from "@/components/article/ArticleCard";
import SearchInput from "@/components/search/SearchInput";

/**
 * Search results page content component.
 * 
 * Fetches articles matching the search query and displays them.
 * 
 * @component
 */
async function SearchResultsContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // In Next.js 15, searchParams is a Promise and needs to be awaited
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || "";
  const searchTerm = query.trim();

  // If no search query, show search input form
  if (!searchTerm) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900 dark:text-gray-100">搜索文章</h1>
          <p className="text-slate-600 dark:text-gray-400">
            输入关键词搜索您感兴趣的文章
          </p>
        </header>

        {/* Search input form */}
        <SearchInput />

        {/* Empty state illustration */}
        <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg p-8 sm:p-12 text-center mt-8">
          <svg
            className="mx-auto h-12 w-12 text-slate-400 dark:text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">开始搜索</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
            在上方输入框中输入关键词，然后点击"搜索"按钮
          </p>
          {/* 搜索提示 */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left max-w-md mx-auto">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-semibold">💡 搜索技巧：</span> 可以搜索文章标题、摘要或内容中的关键词
            </p>
          </div>
        </div>
      </div>
    );
  }

  try {
    // Search articles by title, excerpt, or content (enhanced search)
    // Note: This is a basic implementation. Full-text search can be added in future story.
    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { excerpt: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 50, // Limit results
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

    // Transform articles to match ArticleCardProps format
    const transformedArticles: ArticleCardProps[] = articles.map((article) => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      slug: article.slug,
      publishedAt: article.publishedAt?.toISOString() || null,
      views: (article as any).views ?? 0, // Use type assertion and nullish coalescing for migration compatibility
      category: article.category,
      tags: article.tags.map((at) => at.tag),
      author: article.author,
    }));

    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900 dark:text-gray-100">搜索结果</h1>
          <p className="text-slate-600 dark:text-gray-400 mb-4">
            {transformedArticles.length > 0
              ? `找到 ${transformedArticles.length} 篇与"${searchTerm}"相关的文章`
              : `未找到与"${searchTerm}"相关的文章`}
          </p>
        </header>

        {/* Search input form - 允许用户修改搜索关键词 */}
        <SearchInput />

        {/* Article list */}
        {transformedArticles.length > 0 ? (
          <ArticleList articles={transformedArticles} />
        ) : (
          <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg p-8 sm:p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400 dark:text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">未找到相关文章</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
              请尝试使用其他关键词搜索
            </p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left max-w-md mx-auto">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">💡 搜索技巧：</span> 尝试使用更简短的关键词，或检查拼写是否正确
              </p>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error searching articles:", error);
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-6 py-4 rounded-r">
          <h2 className="text-lg font-semibold mb-2">搜索失败</h2>
          <p className="text-sm">
            无法执行搜索，请稍后重试
          </p>
        </div>
      </div>
    );
  }
}

/**
 * Search results page.
 * 
 * Displays articles matching the search query from URL parameter.
 * 
 * @component
 * @route /search
 */
export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="h-10 bg-slate-200 rounded w-48 mb-2 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
        </div>
        <div className="text-center text-slate-500">加载搜索结果...</div>
      </div>
    }>
      <SearchResultsContent searchParams={searchParams} />
    </Suspense>
  );
}

