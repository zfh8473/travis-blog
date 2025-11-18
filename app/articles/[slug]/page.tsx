import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import ArticleDetail from "@/components/article/ArticleDetail";
import CommentList, { CommentListLoading } from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";
import { enhanceHtmlWithSyntaxHighlighting } from "@/lib/utils/markdown-converter";
import ArticleViewCounter from "./ArticleViewCounter";

/**
 * Article interface for detail page.
 */
interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  status: "PUBLISHED";
  categoryId: string | null;
  authorId: string;
  publishedAt: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

/**
 * Fetch published article by slug directly from database.
 *
 * In Server Components, we can directly use Prisma for better performance
 * instead of making HTTP requests to API routes.
 *
 * @param slug - Article slug
 * @returns Promise resolving to article data or null if not found/not published
 * @throws Error if database query fails
 */
async function fetchArticleBySlug(
  slug: string
): Promise<Article | null> {
  try {
    // Decode URL-encoded slug if needed
    // Next.js should handle this, but be safe for production
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {
      // Already decoded or invalid encoding, use original
      decodedSlug = slug;
    }

    // Query article from database by slug
    const article = await prisma.article.findUnique({
      where: { slug: decodedSlug },
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

    // Article not found
    if (!article) {
      return null;
    }

    // Only allow access to published articles
    if (article.status !== "PUBLISHED") {
      return null;
    }

    // Validate required fields before transformation
    if (!article.id || !article.title || !article.content || !article.slug || !article.author) {
      console.error("Article missing required fields:", {
        slug: decodedSlug,
        hasId: !!article.id,
        hasTitle: !!article.title,
        hasContent: !!article.content,
        hasSlug: !!article.slug,
        hasAuthor: !!article.author,
      });
      return null;
    }

    // Transform tags to simple array format
    // Explicitly construct the object to avoid Date serialization issues
    // Include views count
    // This is critical for Next.js Server Components in production (Vercel)
    // Type assertion is safe because we check for PUBLISHED status
    const transformedArticle: Article = {
      id: String(article.id),
      title: String(article.title),
      content: String(article.content),
      excerpt: article.excerpt ? String(article.excerpt) : null,
      slug: String(article.slug),
      status: "PUBLISHED" as const,
      categoryId: article.categoryId ? String(article.categoryId) : null,
      authorId: String(article.authorId),
      publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
      views: (article as any).views ?? 0, // Use type assertion and nullish coalescing for migration compatibility
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      author: {
        id: String(article.author.id),
        name: article.author.name ? String(article.author.name) : null,
        image: article.author.image ? String(article.author.image) : null,
      },
      category: article.category
        ? {
            id: String(article.category.id),
            name: String(article.category.name),
            slug: String(article.category.slug),
          }
        : null,
      tags: article.tags
        .map((at) => at.tag)
        .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
        .map((tag) => ({
          id: String(tag.id),
          name: String(tag.name),
          slug: String(tag.slug),
        })),
    };

    return transformedArticle;
  } catch (error) {
    console.error("Error fetching article:", {
      slug,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return null instead of throwing to allow 404 handling
    // This prevents 500 errors in production
    return null;
  }
}

/**
 * Generate metadata for article detail page.
 *
 * @param params - Route parameters containing slug
 * @returns Promise resolving to Metadata object
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const article = await fetchArticleBySlug(slug);

    if (!article) {
      return {
        title: "文章不存在",
        description: "您访问的文章不存在或已被删除",
      };
    }

    const description = article.excerpt || `${article.title} - Travis 的博客`;

    return {
      title: article.title,
      description,
      openGraph: {
        title: article.title,
        description,
        type: "article",
        publishedTime: article.publishedAt || undefined,
        authors: article.author.name ? [article.author.name] : undefined,
        tags: article.tags.map((tag) => tag.name).filter(Boolean),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    // Return default metadata on error to prevent 500
    return {
      title: "文章详情",
      description: "Travis 的博客",
    };
  }
}

/**
 * Loading component for Suspense boundary.
 */
function ArticleDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Article detail page content component.
 *
 * Fetches and displays published article with full content.
 *
 * @component
 */
async function ArticleDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const article = await fetchArticleBySlug(slug);

  // Article not found or not published - show 404
  if (!article) {
    notFound();
  }

  // Enhance HTML content with syntax highlighting for code blocks
  const enhancedContent = await enhanceHtmlWithSyntaxHighlighting(article.content);

  return (
    <>
      <ArticleDetail {...article} content={enhancedContent} />
      
      {/* Increment view count on client side - must be after ArticleDetail to ensure DOM is ready */}
      <ArticleViewCounter slug={slug} />
      
      {/* Comments section - temporarily disabled for debugging */}
      {/* <div className="container mx-auto px-4 py-8 max-w-4xl border-t border-gray-200 mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">留言</h2>
        
        <div className="mb-8">
          <CommentForm articleId={article.id} />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">所有留言</h3>
          <Suspense fallback={<CommentListLoading />}>
            <CommentList articleId={article.id} />
          </Suspense>
        </div>
      </div> */}
    </>
  );
}

/**
 * Article detail page.
 *
 * Displays a single article with full content, category, tags, and metadata.
 * Only published articles are accessible to public users.
 *
 * @component
 * @route /articles/[slug]
 * @requires Public access
 *
 * @example
 * User navigates to /articles/article-slug, sees full article content with category and tags
 */
export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<ArticleDetailLoading />}>
      <ArticleDetailContent params={params} />
    </Suspense>
  );
}
