import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import ArticleList from "@/components/article/ArticleList";
import type { ArticleCardProps } from "@/components/article/ArticleCard";

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
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";
  const searchTerm = query.trim();

  // If no search query, show empty state
  if (!searchTerm) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400 mb-4"
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
          <h3 className="text-lg font-medium text-slate-900 mb-2">请输入搜索关键词</h3>
          <p className="text-sm text-slate-500">
            在导航栏的搜索框中输入关键词来搜索文章
          </p>
        </div>
      </div>
    );
  }

  try {
    // Search articles by title or excerpt (basic search)
    // Note: This is a simple implementation. Full-text search can be added in future story.
    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { excerpt: { contains: searchTerm, mode: "insensitive" } },
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
          <h1 className="text-4xl font-bold mb-2 text-slate-900">搜索结果</h1>
          <p className="text-slate-600">
            {transformedArticles.length > 0
              ? `找到 ${transformedArticles.length} 篇与"${searchTerm}"相关的文章`
              : `未找到与"${searchTerm}"相关的文章`}
          </p>
        </header>

        {/* Article list */}
        {transformedArticles.length > 0 ? (
          <ArticleList articles={transformedArticles} />
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400 mb-4"
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
            <h3 className="text-lg font-medium text-slate-900 mb-2">未找到相关文章</h3>
            <p className="text-sm text-slate-500">
              请尝试使用其他关键词搜索
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error searching articles:", error);
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
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
  searchParams: { q?: string };
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

