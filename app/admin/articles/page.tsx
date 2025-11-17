import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import ArticlesListClient, { Article } from "./ArticlesListClient";

/**
 * Article list page (Server Component).
 * 
 * Fetches articles directly from database using Prisma.
 * This avoids the cookie passing issue in client-side fetch requests.
 * 
 * @route /admin/articles
 * @requires Authentication (ADMIN role)
 */
export default async function ArticlesListPage() {
  // Get session using NextAuth.js getServerSession
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/admin/articles");
  }

  // Check if user has admin role
  if (session.user.role !== Role.ADMIN) {
    redirect("/?error=admin_required");
  }

  try {
    // Fetch all articles directly from database
    // Using high limit to get complete dataset for statistics
    // Status filtering and search will be done client-side
    const articles = await prisma.article.findMany({
      take: 1000, // High limit for statistics calculation
      orderBy: {
        createdAt: "desc",
      },
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

    // Transform articles to match Article interface
    const transformedArticles: Article[] = articles.map((article) => ({
      id: article.id,
      title: article.title,
      status: article.status,
      publishedAt: article.publishedAt?.toISOString() || null,
      createdAt: article.createdAt.toISOString(),
      author: {
        id: article.author.id,
        name: article.author.name,
        image: article.author.image,
      },
      category: article.category
        ? {
            id: article.category.id,
            name: article.category.name,
          }
        : null,
      tags: article.tags.map((at) => ({
        id: at.tag.id,
        name: at.tag.name,
      })),
    }));

    return <ArticlesListClient initialArticles={transformedArticles} />;
  } catch (error) {
    console.error("Error fetching articles:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>加载文章列表失败，请刷新页面重试</p>
        </div>
      </div>
    );
  }
}
