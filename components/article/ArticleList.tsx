import ArticleCard, { ArticleCardProps } from "./ArticleCard";

/**
 * Article list component.
 * 
 * Displays a list of articles using ArticleCard components.
 * Handles empty state when no articles are available.
 * 
 * @component
 * @param props - Component props
 * @param props.articles - Array of articles to display
 * 
 * @example
 * ```tsx
 * <ArticleList articles={articleData} />
 * ```
 */
export default function ArticleList({
  articles,
}: {
  articles: ArticleCardProps[];
}) {
  // Empty state
  if (articles.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-slate-900">暂无文章</h3>
        <p className="mt-2 text-sm text-slate-500">
          请稍后再来查看新文章
        </p>
      </div>
    );
  }

  // Article list
  // First article is featured (full width), rest are 2 columns
  const [firstArticle, ...restArticles] = articles;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {/* Featured article (latest) - full width */}
      {firstArticle && (
        <div className="md:col-span-2">
          <ArticleCard
            key={firstArticle.id}
            {...firstArticle}
            isLatest={true}
            animationDelay={0}
          />
        </div>
      )}

      {/* Rest articles - 2 columns */}
      {restArticles.map((article, index) => (
        <ArticleCard
          key={article.id}
          {...article}
          isLatest={false}
          animationDelay={(index + 1) * 0.1}
        />
      ))}
    </div>
  );
}

