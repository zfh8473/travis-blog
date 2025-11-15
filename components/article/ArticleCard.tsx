import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * Category interface.
 */
interface Category {
  id: string;
  name: string;
  slug: string;
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
 * Author interface.
 */
interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

/**
 * Article interface for card display.
 */
export interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  publishedAt: string | null;
  category: Category | null;
  tags: Tag[];
  author: Author;
}

/**
 * Article card component.
 * 
 * Displays a single article in a card format with title, excerpt, publish date,
 * category, and tags. The entire card is clickable and navigates to the article detail page.
 * 
 * @component
 * @param props - Component props
 * @param props.article - The article data to display
 * 
 * @example
 * ```tsx
 * <ArticleCard
 *   id="article-1"
 *   title="My First Article"
 *   excerpt="This is a summary..."
 *   slug="my-first-article"
 *   publishedAt="2025-11-14T10:00:00Z"
 *   category={{ id: "cat-1", name: "技术", slug: "tech" }}
 *   tags={[{ id: "tag-1", name: "React", slug: "react" }]}
 *   author={{ id: "user-1", name: "Travis", image: null }}
 * />
 * ```
 */
export default function ArticleCard({
  id,
  title,
  excerpt,
  slug,
  publishedAt,
  category,
  tags,
  author,
}: ArticleCardProps) {
  // Format publish date
  const formattedDate = publishedAt
    ? format(new Date(publishedAt), "yyyy年MM月dd日", { locale: zhCN })
    : null;

  // Generate excerpt from content if not provided
  const displayExcerpt = excerpt || "暂无摘要";

  return (
    <article className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
      {/* Article title - clickable link */}
      <Link href={`/articles/${slug}`}>
        <h2 className="text-2xl font-bold mb-3 text-gray-900 hover:text-blue-600 transition-colors">
          {title}
        </h2>
      </Link>

      {/* Article excerpt */}
      <p className="text-gray-600 mb-4 line-clamp-2">{displayExcerpt}</p>

      {/* Article metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        {/* Publish date */}
        {formattedDate && (
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formattedDate}
          </span>
        )}

        {/* Author */}
        {author.name && (
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {author.name}
          </span>
        )}

        {/* Category */}
        {category && (
          <Link
            href={`/articles/category/${category.slug}`}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {category.name}
          </Link>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/articles/tag/${tag.slug}`}
              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

