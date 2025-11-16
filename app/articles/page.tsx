import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

/**
 * Articles list page.
 * 
 * Redirects to the first category page or homepage if no categories exist.
 * This maintains backward compatibility while improving UX by directing users
 * directly to category content instead of an intermediate "all articles" page.
 * 
 * The previous implementation showed all articles with category filters, but this
 * created a confusing user experience:
 * - Users clicking "分类" in navigation expected to see categories
 * - The "全部" button in category navigation redirected to homepage
 * - This created inconsistency between navigation entry points
 * 
 * Now, clicking "分类" in navigation takes users directly to the first category,
 * and they can use the category navigation component to switch between categories.
 * 
 * @component
 * @route /articles
 * @requires Public access
 */
export default async function ArticlesListPage() {
  // Get first category for redirect
  const firstCategory = await prisma.category.findFirst({
    orderBy: {
      name: "asc",
    },
    select: {
      slug: true,
    },
  });

  // Redirect to first category or homepage
  if (firstCategory) {
    redirect(`/articles/category/${firstCategory.slug}`);
  } else {
    redirect("/");
  }
}

