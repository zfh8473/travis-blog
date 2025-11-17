"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  isLatest?: boolean; // Mark as latest article
}

/**
 * Article card component.
 * 
 * Displays a single article in a card format with title, excerpt, publish date,
 * category, and tags. The entire card is clickable and navigates to the article detail page.
 * Clicking on category or tag links will navigate to their respective pages without triggering
 * the card click event.
 * 
 * @component
 * @param props - Component props
 * @param props.id - Article ID
 * @param props.title - Article title
 * @param props.excerpt - Article excerpt
 * @param props.slug - Article slug for URL
 * @param props.publishedAt - Publication date
 * @param props.category - Article category
 * @param props.tags - Article tags array
 * @param props.author - Article author
 * @param props.isLatest - Whether this is the latest article
 * @param props.animationDelay - Animation delay in seconds
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
  isLatest = false,
  animationDelay = 0,
}: ArticleCardProps & { animationDelay?: number }) {
  const router = useRouter();

  // Format publish date
  const formattedDate = publishedAt
    ? format(new Date(publishedAt), "yyyy年MM月dd日", { locale: zhCN })
    : null;

  // Generate excerpt from content if not provided
  const displayExcerpt = excerpt || "暂无摘要";

  /**
   * Handle card click to navigate to article detail page.
   */
  const handleCardClick = () => {
    router.push(`/articles/${slug}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`block bg-white/95 backdrop-blur-sm border rounded-xl p-6 article-card-hover article-card-animate relative cursor-pointer ${
        isLatest
          ? "border-blue-300 shadow-md"
          : "border-slate-200/80"
      }`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* 最新文章徽章 */}
      {isLatest && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm">
          ✨ 最新
        </div>
      )}

      {/* 1. 分类标签（顶部） */}
      {category && (
        <Link
          href={`/articles/category/${category.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-block px-3 py-1 bg-indigo-100 text-indigo-600 rounded-xl text-xs font-semibold mb-3 uppercase tracking-wide hover:bg-indigo-200 transition-colors"
        >
          {category.name}
        </Link>
      )}

      {/* 2. 文章标题（最大，最突出） */}
        <h2 className="text-[1.375rem] font-bold text-slate-900 mb-3 leading-snug hover:text-blue-600 transition-colors cursor-pointer">
        {title}
      </h2>

      {/* 3. 摘要（适中，可读性强） */}
      <p className="text-slate-600 text-[0.9375rem] leading-relaxed mb-4 line-clamp-2">
        {displayExcerpt}
      </p>

      {/* 4. 元数据（日期、阅读量等，较小） */}
      <div className="flex gap-4 text-[0.8125rem] text-slate-500 mb-4 pt-3 border-t border-slate-200/50">
        {formattedDate && (
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 opacity-60"
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
        {/* 阅读量占位符（未来可以添加） */}
        <span className="flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5 opacity-60"
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
          <span>0 阅读</span>
        </span>
      </div>

      {/* 5. 标签（底部，小标签） */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/articles/tag/${tag.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition-all duration-200 ease-out hover:bg-blue-600 hover:text-white hover:border-blue-600"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

