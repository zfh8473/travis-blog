import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import NavigationBarClient from "./NavigationBarClient";

/**
 * Navigation bar component (Server Component wrapper).
 * 
 * Fetches authentication session on the server and passes to client component.
 * This allows us to:
 * - Check authentication status without client-side loading delay
 * - Determine which buttons to show (Login vs Publish Article)
 * - Maintain SEO-friendly server-side rendering
 * 
 * @component
 */
export default async function NavigationBar() {
  // Get session on server side
  const session = await getServerSession(authOptions);

  // Determine authentication and admin status
  const isAuthenticated = !!session && !!session.user;
  const isAdmin = session?.user?.role === Role.ADMIN;

  // Get first category for "分类" link
  // If no categories exist, fallback to homepage
  const firstCategory = await prisma.category.findFirst({
    orderBy: {
      name: "asc",
    },
    select: {
      slug: true,
    },
  });

  const categoryHref = firstCategory
    ? `/articles/category/${firstCategory.slug}`
    : "/";

  return (
    <NavigationBarClient
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      categoryHref={categoryHref}
    />
  );
}

