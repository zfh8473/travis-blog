import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";

/**
 * E2E tests for admin dashboard access flow.
 * 
 * Tests complete user flows including:
 * - Admin user accessing admin dashboard (AC-6.1.1)
 * - Unauthenticated user redirect to login (AC-6.1.2)
 * - Regular user redirect to homepage (AC-6.1.3)
 * - Navigation menu functionality (AC-6.1.4)
 * - Consistent layout across admin pages (AC-6.1.5)
 */

test.describe("Admin Dashboard E2E Tests", () => {
  const testAdminEmail = "e2e-admin-dashboard@example.com";
  const testAdminPassword = "TestPassword123!";
  const testUserEmail = "e2e-regular-user@example.com";
  const testUserPassword = "TestPassword123!";
  let testAdminId: string;
  let testUserId: string;

  test.beforeAll(async () => {
    // Create test admin user
    const adminUser = await prisma.user.upsert({
      where: { email: testAdminEmail },
      update: {},
      create: {
        email: testAdminEmail,
        password: testAdminPassword,
        name: "Test Admin",
        role: "ADMIN",
      },
    });
    testAdminId = adminUser.id;

    // Create test regular user
    const regularUser = await prisma.user.upsert({
      where: { email: testUserEmail },
      update: {},
      create: {
        email: testUserEmail,
        password: testUserPassword,
        name: "Test User",
        role: "USER",
      },
    });
    testUserId = regularUser.id;
  });

  test.afterAll(async () => {
    // Clean up test users
    try {
      await prisma.user.deleteMany({
        where: {
          id: { in: [testAdminId, testUserId] },
        },
      });
    } catch (error) {
      console.warn("Error during test cleanup:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  /**
   * Helper function to login as admin
   */
  async function loginAsAdmin(page: any) {
    await page.goto("/login");
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', testAdminEmail);
    await page.fill('input[type="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|profile|dashboard)/, { timeout: 10000 });
  }

  /**
   * Helper function to login as regular user
   */
  async function loginAsUser(page: any) {
    await page.goto("/login");
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(profile|dashboard)/, { timeout: 10000 });
  }

  test.describe("AC-6.1.1: Admin Dashboard Access", () => {
    test("should display admin dashboard with navigation menu for admin user", async ({
      page,
    }) => {
      await loginAsAdmin(page);
      await page.goto("/admin");

      // Check dashboard title
      await expect(page.locator("h1")).toContainText("仪表板");

      // Check navigation menu items
      await expect(page.getByText("仪表板")).toBeVisible();
      await expect(page.getByText("文章管理")).toBeVisible();
      await expect(page.getByText("媒体管理")).toBeVisible();

      // Check welcome message
      await expect(page.getByText(/欢迎/)).toBeVisible();

      // Check user information
      await expect(page.getByText(testAdminEmail)).toBeVisible();
    });
  });

  test.describe("AC-6.1.2: Unauthenticated User Redirect", () => {
    test("should redirect unauthenticated user to login with callbackUrl", async ({
      page,
    }) => {
      await page.goto("/admin");

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
      const url = page.url();
      expect(url).toContain("callbackUrl=/admin");
    });

    test("should redirect back to admin after login", async ({ page }) => {
      await page.goto("/admin");
      await page.waitForURL(/\/login/);

      // Login
      await page.fill('input[type="email"]', testAdminEmail);
      await page.fill('input[type="password"]', testAdminPassword);
      await page.click('button[type="submit"]');

      // Should redirect back to /admin
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    });
  });

  test.describe("AC-6.1.3: Regular User Redirect", () => {
    test("should redirect regular user to homepage with error", async ({
      page,
    }) => {
      await loginAsUser(page);
      await page.goto("/admin");

      // Should redirect to homepage
      await expect(page).toHaveURL(/\//);
      
      // Check for error parameter in URL
      const url = page.url();
      expect(url).toContain("error=admin_required");
    });
  });

  test.describe("AC-6.1.4: Navigation Menu Functionality", () => {
    test("should navigate to articles page when clicking articles link", async ({
      page,
    }) => {
      await loginAsAdmin(page);
      await page.goto("/admin");

      // Click articles link
      await page.getByText("文章管理").click();

      // Should navigate to articles page
      await expect(page).toHaveURL(/\/admin\/articles/);
    });

    test("should navigate to media page when clicking media link", async ({
      page,
    }) => {
      await loginAsAdmin(page);
      await page.goto("/admin");

      // Click media link
      await page.getByText("媒体管理").click();

      // Should navigate to media page
      await expect(page).toHaveURL(/\/admin\/media/);
    });

    test("should navigate to dashboard when clicking dashboard link", async ({
      page,
    }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      // Click dashboard link
      await page.getByText("仪表板").click();

      // Should navigate to dashboard
      await expect(page).toHaveURL(/\/admin$/);
    });
  });

  test.describe("AC-6.1.5: Consistent Layout Across Pages", () => {
    test("should show same layout on dashboard page", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin");

      // Check header
      await expect(page.getByText("Travis Blog Admin")).toBeVisible();

      // Check navigation menu
      await expect(page.getByText("仪表板")).toBeVisible();
      await expect(page.getByText("文章管理")).toBeVisible();
      await expect(page.getByText("媒体管理")).toBeVisible();
    });

    test("should show same layout on articles page", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      // Check header
      await expect(page.getByText("Travis Blog Admin")).toBeVisible();

      // Check navigation menu
      await expect(page.getByText("仪表板")).toBeVisible();
      await expect(page.getByText("文章管理")).toBeVisible();
      await expect(page.getByText("媒体管理")).toBeVisible();
    });

    test("should show same layout on media page", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/media");

      // Check header
      await expect(page.getByText("Travis Blog Admin")).toBeVisible();

      // Check navigation menu
      await expect(page.getByText("仪表板")).toBeVisible();
      await expect(page.getByText("文章管理")).toBeVisible();
      await expect(page.getByText("媒体管理")).toBeVisible();
    });
  });
});

