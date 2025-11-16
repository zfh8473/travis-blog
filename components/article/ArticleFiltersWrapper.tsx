import { prisma } from "@/lib/db/prisma";
import ArticleFilters from "./ArticleFilters";

/**
 * Server component wrapper for ArticleFilters.
 * 
 * Fetches categories from database and passes to client component.
 * 
 * @component
 */
export default async function ArticleFiltersWrapper() {
  // Fetch all categories from database
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return <ArticleFilters categories={categories} />;
}

