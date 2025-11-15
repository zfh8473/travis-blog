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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <h3 className="mt-4 text-lg font-medium text-gray-900">暂无文章</h3>
        <p className="mt-2 text-sm text-gray-500">
          请稍后再来查看新文章
        </p>
      </div>
    );
  }

  // Article list
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard key={article.id} {...article} />
      ))}
    </div>
  );
}

