import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import NavigationBarClientWithCustomLogo from "./NavigationBarClientWithCustomLogo";

/**
 * Navigation bar component with custom logo (Server Component wrapper).
 * 
 * Used for logo demo pages to display different logo options.
 * 
 * @component
 * @param logoId - Logo option ID (1-6)
 */
export default async function NavigationBarWithCustomLogo({
  logoId,
}: {
  logoId: number;
}) {
  // Get session on server side
  const session = await getServerSession(authOptions);

  // Determine authentication and admin status
  const isAuthenticated = !!session && !!session.user;
  const isAdmin = session?.user?.role === Role.ADMIN;

  // Get first category for "分类" link
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
    <NavigationBarClientWithCustomLogo
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      categoryHref={categoryHref}
      logoId={logoId}
    />
  );
}

