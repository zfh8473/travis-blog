import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import EditArticleClient, { Article, Category, Tag } from "./EditArticleClient";

/**
 * Article edit page (Server Component).
 * 
 * Fetches article, categories, and tags directly from database using Prisma.
 * This avoids the cookie passing issue in client-side fetch requests.
 * 
 * @route /admin/articles/[id]/edit
 * @requires Authentication (ADMIN role)
 */
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = id;

  // Get session using NextAuth.js getServerSession
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/admin/articles/" + articleId + "/edit");
  }

  // Check if user has admin role
  if (session.user.role !== Role.ADMIN) {
    redirect("/?error=admin_required");
  }

  try {
    // Fetch article, categories, and tags in parallel
    const [article, categories, tags] = await Promise.all([
      // Fetch article
      prisma.article.findUnique({
        where: { id: articleId },
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
      }),
      // Fetch categories
      prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      }),
      // Fetch tags
      prisma.tag.findMany({
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    // Check if article exists
    if (!article) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p>文章不存在</p>
          </div>
        </div>
      );
    }

    // Transform article to match Article interface
    const transformedArticle: Article = {
      id: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      categoryId: article.categoryId,
      tags: article.tags
        .map((at) => at.tag)
        .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
        .map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })),
      status: article.status,
    };

    // Transform categories
    const transformedCategories: Category[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));

    // Transform tags
    const transformedTags: Tag[] = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));

    return (
      <EditArticleClient
        article={transformedArticle}
        categories={transformedCategories}
        tags={transformedTags}
      />
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>加载数据失败，请刷新页面重试</p>
        </div>
      </div>
    );
  }
}
