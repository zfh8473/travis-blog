import { PrismaClient } from "@prisma/client";

/**
 * Global variable to store Prisma Client instance.
 * 
 * This is used to prevent multiple instances of Prisma Client
 * during Next.js development hot-reload. In development, Next.js
 * can create multiple instances of modules, which would result in
 * multiple database connections. Using a global variable ensures
 * we reuse the same instance across hot-reloads.
 * 
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prevent-hot-reloading-from-creating-new-instances
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Creates a new Prisma Client instance.
 * 
 * Validates that DATABASE_URL is set before creating the client.
 * The database connection string is read from the `DATABASE_URL`
 * environment variable, which is configured in `.env.local`.
 * 
 * Prisma automatically handles:
 * - Connection pooling (default configuration)
 * - SQL injection prevention (parameterized queries)
 * - Type-safe database access
 * 
 * @returns {PrismaClient} A new Prisma Client instance
 * @throws {Error} If DATABASE_URL environment variable is not set
 */
function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please configure it in .env.local"
    );
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

/**
 * Prisma Client instance with singleton pattern.
 * 
 * This exports a Prisma Client instance that uses a singleton pattern
 * to prevent multiple instances during Next.js development hot-reload.
 * 
 * The instance is created using `createPrismaClient()` which validates
 * the DATABASE_URL environment variable. The singleton pattern ensures
 * that the same instance is reused across hot-reloads in development.
 * 
 * @returns {PrismaClient} The Prisma Client instance
 * 
 * @example
 * ```typescript
 * import { prisma } from '@/lib/db/prisma';
 * 
 * // Use in Server Components or Server Actions
 * const users = await prisma.user.findMany();
 * ```
 */
export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

