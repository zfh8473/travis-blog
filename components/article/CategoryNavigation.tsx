import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

/**
 * Category interface.
 */
interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Category navigation component.
 * 
 * Displays all categories as navigation pills, with the current category highlighted.
 * Allows users to quickly switch between categories.
 * 
 * @component
 * @param props - Component props
 * @param props.currentCategorySlug - Slug of the currently selected category
 */
export default async function CategoryNavigation({
  currentCategorySlug,
}: {
  currentCategorySlug?: string;
}) {
  // Fetch all categories from database
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-slate-600">分类导航：</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Category links */}
        {categories.map((category) => {
          const isActive = currentCategorySlug === category.slug;
          return (
            <Link
              key={category.id}
              href={`/articles/category/${category.slug}`}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
                isActive
                  ? "bg-blue-600 text-white border border-blue-600 shadow-sm"
                  : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 hover:border-slate-400"
              }`}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

