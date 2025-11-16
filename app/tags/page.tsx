import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

/**
 * Tags page content component.
 * 
 * Displays all tags with article counts.
 * 
 * @component
 */
async function TagsPageContent() {
  try {
    // Get all tags with article counts
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            articles: {
              where: {
                article: {
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Filter tags that have at least one published article
    const tagsWithArticles = tags.filter(
      (tag) => tag._count.articles > 0
    );

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
        {/* Page header */}
        <header className="mb-8">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏷️</span>
              <h1 className="text-4xl font-bold text-slate-900">标签</h1>
            </div>
          <p className="text-slate-600">
            {tagsWithArticles.length > 0
              ? `共 ${tagsWithArticles.length} 个标签`
              : "暂无标签"}
          </p>
          </div>
        </header>

        {/* Tags list */}
        {tagsWithArticles.length > 0 ? (
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
          <div className="flex flex-wrap gap-3">
              {tagsWithArticles.map((tag) => {
                // Calculate tag size based on article count (similar to sidebar)
                const count = tag._count.articles;
                const sizeClass =
                  count >= 5
                    ? "text-base font-bold"
                    : count >= 3
                    ? "text-sm font-semibold"
                    : "text-sm font-medium";
                
                // Remove '#' from tag name if present
                const displayName = tag.name.replace(/^#+/, '');
                
                return (
              <Link
                key={tag.id}
                href={`/articles/tag/${tag.slug}`}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg transition-all duration-200 ease-out hover:bg-blue-600 hover:text-white hover:border-blue-600 ${sizeClass}`}
              >
                    <span>{displayName}</span>
                    <span className="text-xs opacity-75">
                      ({count})
                </span>
              </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-12 text-center">
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-2">暂无标签</h3>
            <p className="text-sm text-slate-500">
              标签将在文章发布时自动创建
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error fetching tags:", error);
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">加载失败</h2>
          <p className="text-sm">
            无法加载标签列表，请稍后重试
          </p>
        </div>
      </div>
    );
  }
}

/**
 * Tags page.
 * 
 * Displays all available tags with article counts.
 * 
 * @component
 * @route /tags
 */
export default function TagsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
        <div className="mb-8">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 mb-6">
          <div className="h-10 bg-slate-200 rounded w-48 mb-2 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
        <div className="text-center text-slate-500">加载标签...</div>
        </div>
      </div>
    }>
      <TagsPageContent />
    </Suspense>
  );
}

