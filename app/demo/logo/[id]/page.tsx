import { notFound } from "next/navigation";
import NavigationBarWithCustomLogo from "@/components/layout/NavigationBarWithCustomLogo";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { prisma } from "@/lib/db/prisma";
import ArticleList from "@/components/article/ArticleList";
import ArticleFilters from "@/components/article/ArticleFilters";

/**
 * Logo demo page - displays homepage with custom logo.
 * 
 * Creates 6 different pages (id: 1-6) each showing the homepage
 * with a different logo option in the navigation bar.
 * 
 * @route /demo/logo/[id]
 * @param params - Route parameters containing logo ID
 */
export default async function LogoDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { id } = await params;
  const logoId = parseInt(id, 10);

  // Validate logo ID (must be 1-6)
  if (isNaN(logoId) || logoId < 1 || logoId > 6) {
    notFound();
  }

  const logoNames = [
    "",
    "风 · 书韵",
    "風 · 印章",
    "风 · 水墨",
    "风 · 徽章",
    "風 · 竹简",
    "风 · 简雅",
  ];

  // Fetch articles (same logic as homepage)
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams.category;
  const sort = resolvedSearchParams.sort;

  // Fetch categories for filter
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  // Build query conditions
  const where: any = {
    status: "PUBLISHED",
  };

  if (category) {
    const categoryObj = categories.find((c) => c.slug === category);
    if (categoryObj) {
      where.categoryId = categoryObj.id;
    }
  }

  // Determine sort order
  let orderBy: any = { publishedAt: "desc" };
  let needInMemorySort = false;

  if (sort) {
    const normalizedSort = sort.trim();
    if (normalizedSort === "最早") {
      orderBy = { publishedAt: "asc" };
    } else if (normalizedSort === "最热") {
      orderBy = { views: "desc" };
    } else if (normalizedSort === "最多评论") {
      // Need to sort by comment count in memory
      needInMemorySort = true;
      orderBy = { publishedAt: "desc" }; // Default order for query
    }
  }

  // Fetch articles
  let articles = await prisma.article.findMany({
    where,
    orderBy,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  // Sort by comment count if needed
  if (needInMemorySort) {
    articles = articles.sort((a, b) => {
      return b._count.comments - a._count.comments;
    });
  }

  // Transform articles to match ArticleCardProps format
  const transformedArticles = articles.map((article) => ({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    slug: article.slug,
    publishedAt: article.publishedAt?.toISOString() || null,
    views: (article as any).views ?? 0,
    category: article.category,
    tags: article.tags.map((at) => at.tag),
    author: {
      id: article.author.id,
      name: article.author.name,
      image: null, // ArticleCardProps doesn't require image
    },
  }));

  return (
    <>
      <NavigationBarWithCustomLogo logoId={logoId} />
      <div className="mb-4 text-center bg-blue-50 dark:bg-blue-900/20 py-2 px-4 rounded-lg mx-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">当前展示：{logoNames[logoId]}</span> | 
          <a href="/" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">返回首页</a> | 
          {logoId > 1 && (
            <a href={`/demo/logo/${logoId - 1}`} className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">← 上一个</a>
          )}
          {logoId < 6 && (
            <a href={`/demo/logo/${logoId + 1}`} className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">下一个 →</a>
          )}
        </p>
      </div>
      
      {/* Homepage Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            欢迎来到 Travis Blog
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            分享技术与思考
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <ArticleFilters categories={categories} />
        </div>

        {/* Article List */}
        <ArticleList articles={transformedArticles} />
      </div>
      
      <MobileBottomNav />
    </>
  );
}

