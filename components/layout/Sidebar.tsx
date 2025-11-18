import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { extractFirstImage, generatePlaceholderThumbnail } from "@/lib/utils/image-extractor";

/**
 * Sidebar component for desktop view.
 * 
 * Displays:
 * - Popular articles
 * - Tag cloud
 * - Archives
 * 
 * @component
 */
export default async function Sidebar() {
  // Fetch popular articles (most recent published articles)
  const popularArticles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
      content: true, // Include content to extract image
    },
  });

  // Fetch tags with article counts
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

  // Fetch archives (group by month)
  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: {
        not: null,
      },
    },
    select: {
      publishedAt: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  // Group articles by month
  const archives = articles.reduce((acc, article) => {
    if (!article.publishedAt) return acc;
    const monthKey = format(article.publishedAt, "yyyy-MM", { locale: zhCN });
    const monthLabel = format(article.publishedAt, "yyyy年MM月", { locale: zhCN });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: monthLabel,
        count: 0,
        slug: monthKey,
      };
    }
    acc[monthKey].count++;
    return acc;
  }, {} as Record<string, { label: string; count: number; slug: string }>);

  const archiveList = Object.values(archives).slice(0, 12); // Show last 12 months

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Popular Articles */}
        <section className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
          <h3 className="sidebar-title text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>🔥</span>
            <span>热门文章</span>
          </h3>
          {/* Divider between title and content */}
          <div className="border-t border-slate-200/80 mb-4" />
          <div className="space-y-4">
            {popularArticles.length > 0 ? (
              popularArticles.map((article, index) => {
                // Get first letter for thumbnail
                const firstLetter = article.title.charAt(0).toUpperCase();
                // Extract thumbnail from content or generate placeholder
                // Pass article.id as uniqueId to ensure uniqueness even when titles have same first letter
                const thumbnailUrl = extractFirstImage(article.content || "") || generatePlaceholderThumbnail(article.title, index, popularArticles.length, article.id);
                
                return (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="popular-article flex gap-3 p-2 -m-2 rounded-lg group"
                  >
                    {/* Thumbnail */}
                    <div className="popular-article-thumb flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600">
                      {thumbnailUrl.startsWith("data:") ? (
                        <img
                          key={`thumbnail-${article.id}`}
                          src={thumbnailUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          {thumbnailUrl ? (
                            <Image
                              src={thumbnailUrl}
                              alt={article.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <span>{firstLetter}</span>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="popular-article-content flex-1 min-w-0">
                      <div className="popular-article-title text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                        {article.title}
                      </div>
                      <div className="popular-article-meta text-xs text-slate-500">
                        {article.publishedAt
                          ? format(new Date(article.publishedAt), "yyyy年MM月dd日", {
                              locale: zhCN,
                            })
                          : "0 阅读"}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">暂无热门文章</p>
            )}
          </div>
        </section>

        {/* Tag Cloud */}
        <section className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
          <h3 className="sidebar-title text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>🏷️</span>
            <span>标签云</span>
          </h3>
          {/* Divider between title and content */}
          <div className="border-t border-slate-200/80 mb-4" />
          <div className="flex flex-wrap gap-2">
            {tagsWithArticles.length > 0 ? (
              tagsWithArticles.map((tag) => {
                // Calculate tag size based on article count
                const count = tag._count.articles;
                // 调整字体大小：稍微调大并加粗
                const sizeClass =
                  count >= 5
                    ? "text-base font-bold" // 从 font-semibold 改为 font-bold
                    : count >= 3
                    ? "text-sm font-semibold" // 从 font-medium 改为 font-semibold，从 text-xs 改为 text-sm
                    : "text-sm font-medium"; // 从 text-xs 改为 text-sm
                
                // Remove '#' from tag name if present
                const displayName = tag.name.replace(/^#+/, '');
                
                return (
                  <Link
                    key={tag.id}
                    href={`/articles/tag/${tag.slug}`}
                    className={`inline-block px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg transition-all duration-200 ease-out hover:bg-blue-600 hover:text-white hover:border-blue-600 ${sizeClass}`}
                  >
                    {displayName}
                    <span className="ml-1 text-xs opacity-75">
                      ({count})
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">暂无标签</p>
            )}
          </div>
        </section>

        {/* Archives */}
        <section className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
          <h3 className="sidebar-title text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>📅</span>
            <span>归档</span>
          </h3>
          {/* Divider between title and content */}
          <div className="border-t border-slate-200/80 mb-4" />
          <div className="space-y-2">
            {archiveList.length > 0 ? (
              archiveList.map((archive) => (
                <Link
                  key={archive.slug}
                  href={`/articles/archive/${archive.slug}`}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">
                    {archive.label}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {archive.count}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">暂无归档</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}

