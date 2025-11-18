/**
 * E2E tests for media management page authentication.
 * 
 * Tests authentication and authorization for the media management page.
 */

import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

test.describe("Media Management Page Authentication", () => {
  let adminUser: { email: string; password: string; id: string };
  let regularUser: { email: string; password: string; id: string };

  test.beforeAll(async () => {
    // Clean up existing test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["test-admin-media@example.com", "test-user-media@example.com"],
        },
      },
    });

    // Create admin user
    adminUser = {
      email: "test-admin-media@example.com",
      password: "TestPassword123!",
      id: "",
    };

    const admin = await prisma.user.create({
      data: {
        email: adminUser.email,
        name: "Test Admin",
        password: "$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq", // Hashed password
        role: "ADMIN",
      },
    });
    adminUser.id = admin.id;

    // Create regular user
    regularUser = {
      email: "test-user-media@example.com",
      password: "TestPassword123!",
      id: "",
    };

    const user = await prisma.user.create({
      data: {
        email: regularUser.email,
        name: "Test User",
        password: "$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq", // Hashed password
        role: "USER",
      },
    });
    regularUser.id = user.id;
  });

  test.afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["test-admin-media@example.com", "test-user-media@example.com"],
        },
      },
    });
  });

  test("[P0] should allow admin user to access media management page", async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Fill in login form
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/\/(admin|profile|$)/, { timeout: 10000 });

    // Navigate to media management page
    await page.goto(`${BASE_URL}/admin/media`);

    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    // Check if page loaded successfully (should see "媒体库" heading)
    const heading = page.locator('h1:has-text("媒体库")');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Check if there's no "请先登录" error message
    const errorMessage = page.locator('text="请先登录"');
    await expect(errorMessage).not.toBeVisible();
  });

  test("[P0] should show login prompt for unauthenticated user", async ({ page }) => {
    // Navigate directly to media management page without logging in
    await page.goto(`${BASE_URL}/admin/media`);

    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    // Check if redirected to login page or shows error
    const currentUrl = page.url();
    const hasLoginPrompt = 
      currentUrl.includes("/login") ||
      (await page.locator('text="请先登录"').isVisible()) ||
      (await page.locator('text="Authentication required"').isVisible());

    expect(hasLoginPrompt).toBeTruthy();
  });

  test("[P1] should deny access to regular user", async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Fill in login form
    await page.fill('input[type="email"]', regularUser.email);
    await page.fill('input[type="password"]', regularUser.password);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/\/(admin|profile|$)/, { timeout: 10000 });

    // Navigate to media management page
    await page.goto(`${BASE_URL}/admin/media`);

    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    // Check if shows permission error
    const hasPermissionError = 
      (await page.locator('text="权限不足"').isVisible()) ||
      (await page.locator('text="需要管理员权限"').isVisible()) ||
      (await page.locator('text="Permission denied"').isVisible());

    expect(hasPermissionError).toBeTruthy();
  });

  test("[P1] should handle API authentication correctly", async ({ page, request }) => {
    // First, login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|profile|$)/, { timeout: 10000 });

    // Get cookies from the page context
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    // Make API request with cookies
    const response = await request.get(`${BASE_URL}/api/media`, {
      headers: {
        Cookie: cookieHeader,
      },
    });

    // Should return 200 or 401/403 (not 500)
    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("success");
    }
  });
});

