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
 * Article interface for detail component.
 */
export interface ArticleDetailProps {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  publishedAt: string | null;
  category: Category | null;
  tags: Tag[];
  author: Author;
}

/**
 * Article detail component.
 *
 * Displays a single article with full content, category, tags, and metadata.
 * The component renders article title, content, publish date, category, tags, author, and excerpt.
 *
 * @component
 * @param props - Component props
 * @param props.article - The article data to display
 *
 * @example
 * ```tsx
 * <ArticleDetail
 *   id="article-1"
 *   title="My First Article"
 *   content="<p>Article content...</p>"
 *   excerpt="This is a summary..."
 *   slug="my-first-article"
 *   publishedAt="2025-11-14T10:00:00Z"
 *   category={{ id: "cat-1", name: "技术", slug: "tech" }}
 *   tags={[{ id: "tag-1", name: "React", slug: "react" }]}
 *   author={{ id: "user-1", name: "Travis", image: null }}
 * />
 * ```
 */
export default function ArticleDetail({
  id,
  title,
  content,
  excerpt,
  slug,
  publishedAt,
  category,
  tags,
  author,
}: ArticleDetailProps) {
  // Format publish date
  const formattedDate = publishedAt
    ? format(new Date(publishedAt), "yyyy年MM月dd日", { locale: zhCN })
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Article header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">{title}</h1>

        {/* Article metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
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
        </div>

        {/* Category and tags */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category badge */}
          {category ? (
            <Link
              href={`/articles/category/${category.slug}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
            >
              {category.name}
            </Link>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              未分类
            </span>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <>
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/articles/tag/${tag.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </>
          )}
        </div>
      </header>

      {/* Article excerpt */}
      {excerpt && (
        <div className="mb-6 p-4 bg-gray-50 border-l-4 border-blue-500 rounded">
          <p className="text-gray-700 italic">{excerpt}</p>
        </div>
      )}

      {/* Article content */}
      <article
        className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-blue-500 prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}

