import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

/**
 * Seed script to create initial admin user.
 * 
 * Creates an admin user if one doesn't exist.
 * Admin email can be set via ADMIN_EMAIL environment variable.
 * Admin password can be set via ADMIN_PASSWORD environment variable.
 * 
 * Default admin email: admin@example.com
 * Default admin password: admin123 (should be changed in production)
 * 
 * Usage:
 * ```bash
 * npx tsx prisma/seed.ts
 * ```
 * 
 * Or with environment variables:
 * ```bash
 * ADMIN_EMAIL=admin@myblog.com ADMIN_PASSWORD=securepassword npx tsx prisma/seed.ts
 * ```
 */
async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Admin User";

  console.log("🌱 Starting database seed...");

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    if (existingAdmin.role === Role.ADMIN) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      return;
    } else {
      // User exists but is not admin - update to admin
      console.log(`🔄 Updating existing user to admin: ${adminEmail}`);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: Role.ADMIN },
      });
      console.log(`✅ User updated to admin: ${adminEmail}`);
      return;
    }
  }

  // Create new admin user
  console.log(`📝 Creating admin user: ${adminEmail}`);
  const hashedPassword = await hashPassword(adminPassword);

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Admin user created successfully!`);
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Name: ${adminUser.name}`);
  console.log(`   Role: ${adminUser.role}`);
  console.log(`   ID: ${adminUser.id}`);
  console.log(`\n⚠️  IMPORTANT: Change the default password in production!`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

