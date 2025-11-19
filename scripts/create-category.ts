import { PrismaClient } from "@prisma/client";
import { generateSlug } from "@/lib/utils/slug";

const prisma = new PrismaClient();

/**
 * Script to create a new category.
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/create-category.ts "技术" "tech"
 * ```
 * 
 * Or with default values:
 * ```bash
 * npx tsx scripts/create-category.ts
 * ```
 */
async function main() {
  const categoryName = process.argv[2] || "技术";
  const categorySlug = process.argv[3] || generateSlug(categoryName);

  console.log(`🌱 Creating category: ${categoryName} (${categorySlug})`);

  try {
    // Check if category already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: categoryName },
          { slug: categorySlug },
        ],
      },
    });

    if (existingCategory) {
      console.log(`⚠️  Category already exists: ${existingCategory.name} (${existingCategory.slug})`);
      return;
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: categoryName,
        slug: categorySlug,
      },
    });

    console.log(`✅ Category created successfully!`);
    console.log(`   ID: ${category.id}`);
    console.log(`   Name: ${category.name}`);
    console.log(`   Slug: ${category.slug}`);
  } catch (error) {
    console.error("❌ Error creating category:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

