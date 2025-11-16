/**
 * Script to set a user as admin by email.
 * 
 * Usage: npx tsx scripts/set-admin.ts <email>
 * Example: npx tsx scripts/set-admin.ts zfh8473@gmail.com
 */

import { prisma } from "../lib/db/prisma";

async function setAdmin(email: string) {
  try {
    console.log(`正在查找用户: ${email}...`);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ 错误: 未找到邮箱为 ${email} 的用户`);
      console.log("提示: 请确保用户已经注册");
      process.exit(1);
    }

    console.log(`找到用户:`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - 邮箱: ${user.email}`);
    console.log(`  - 姓名: ${user.name || "未设置"}`);
    console.log(`  - 当前角色: ${user.role}`);

    if (user.role === "ADMIN") {
      console.log(`✅ 用户已经是管理员，无需更新`);
      process.exit(0);
    }

    // Update user role to ADMIN
    console.log(`\n正在更新用户角色为 ADMIN...`);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`\n✅ 成功! 用户角色已更新为管理员`);
    console.log(`更新后的用户信息:`);
    console.log(`  - ID: ${updatedUser.id}`);
    console.log(`  - 邮箱: ${updatedUser.email}`);
    console.log(`  - 姓名: ${updatedUser.name || "未设置"}`);
    console.log(`  - 角色: ${updatedUser.role}`);
    console.log(`\n提示: 请重新登录以使权限生效`);
  } catch (error) {
    console.error("❌ 错误:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("❌ 错误: 请提供邮箱地址");
  console.log("用法: npx tsx scripts/set-admin.ts <email>");
  console.log("示例: npx tsx scripts/set-admin.ts zfh8473@gmail.com");
  process.exit(1);
}

// Validate email format (basic check)
if (!email.includes("@")) {
  console.error("❌ 错误: 邮箱格式无效");
  process.exit(1);
}

// Run the script
setAdmin(email);

