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
  views: number;
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
  views,
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
      <header className="mb-10">
        <h1 className="text-5xl font-bold mb-6 leading-snug tracking-normal 
          bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 bg-clip-text text-transparent
          relative pb-5
          after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-20 after:h-0.5 
          after:bg-gradient-to-r after:from-blue-400 after:via-blue-500 after:to-slate-400 
          after:rounded-full after:opacity-60">
          {title}
        </h1>

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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {views.toLocaleString()} 次阅读
          </span>
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
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-8 md:px-10 md:py-12">
        <article
          className="prose prose-lg prose-slate max-w-none
            prose-headings:font-bold prose-headings:text-slate-900
            prose-headings:mt-8 prose-headings:mb-4
            prose-h1:text-2xl prose-h1:font-bold prose-h1:mt-8 prose-h1:mb-4
            prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2
            prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-xl prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
            prose-p:text-base
            prose-a:text-blue-600 prose-a:no-underline 
            hover:prose-a:underline prose-a:font-medium
            prose-a:transition-colors
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-em:text-gray-800 prose-em:italic
            prose-code:text-blue-600 prose-code:bg-blue-50 
            prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded 
            prose-code:font-mono prose-code:text-sm prose-code:font-medium
            prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-gray-900 prose-pre:text-gray-100 
            prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
            prose-pre:border prose-pre:border-gray-800 prose-pre:shadow-lg
            prose-pre:my-6
            prose-pre:code:text-gray-100 prose-pre:code:bg-transparent
            prose-pre:code:p-0 prose-pre:code:rounded-none
            prose-pre:code:before:content-none prose-pre:code:after:content-none
            prose-blockquote:border-l-blue-500 prose-blockquote:border-l-4 
            prose-blockquote:pl-6 prose-blockquote:italic 
            prose-blockquote:bg-blue-50 prose-blockquote:py-3 prose-blockquote:pr-4
            prose-blockquote:rounded-r prose-blockquote:my-6
            prose-blockquote:text-gray-700
            prose-ul:list-disc prose-ul:pl-6 prose-ul:my-6
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-6
            prose-li:my-2 prose-li:leading-relaxed prose-li:text-gray-700
            prose-li:marker:text-gray-500
            prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
            prose-img:max-w-full prose-img:h-auto
            prose-table:w-full prose-table:border-collapse prose-table:my-6
            prose-th:bg-gray-100 prose-th:font-semibold prose-th:p-3
            prose-th:text-left prose-th:text-gray-900 prose-th:border prose-th:border-gray-300
            prose-td:p-3 prose-td:border prose-td:border-gray-200 prose-td:text-gray-700
            prose-tr:border-b prose-tr:border-gray-200
            prose-hr:border-gray-300 prose-hr:my-8 prose-hr:border-t-2"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}

