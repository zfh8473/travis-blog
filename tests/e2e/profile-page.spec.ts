import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { Role } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

/**
 * E2E tests for profile page.
 * 
 * Tests complete user flows including:
 * - View profile page (authenticated)
 * - Update profile information
 * - Upload avatar
 * - Verify profile updates persist
 */

test.describe("Profile Page E2E Tests", () => {
  const testUserEmail = "e2e-profile-test@example.com";
  const testUserPassword = "testPassword123";
  let testUserId: string;

  test.beforeAll(async () => {
    // Create a test user
    const hashedPassword = await hashPassword(testUserPassword);
    const user = await prisma.user.upsert({
      where: { email: testUserEmail },
      update: {
        password: hashedPassword,
        role: Role.USER,
      },
      create: {
        email: testUserEmail,
        password: hashedPassword,
        name: "E2E Test User",
        role: Role.USER,
      },
    });
    testUserId = user.id;
  });

  test.afterAll(async () => {
    try {
      // Clean up test user and any uploaded files
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { image: true },
      });

      // Delete uploaded avatar file if exists
      if (user?.image) {
        try {
          const filePath = path.join(process.cwd(), "public", user.image);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.warn("Failed to delete test avatar file:", error);
        }
      }

      // Delete test user (use deleteMany to avoid error if user doesn't exist)
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
    } catch (error) {
      console.warn("Error during test cleanup:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  /**
   * Helper function to login as test user
   */
  async function loginAsTestUser(page: any) {
    await page.goto("/login");
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill in credentials
    await page.locator('input[name="email"]').fill(testUserEmail);
    await page.locator('input[name="password"]').fill(testUserPassword);
    
    // Click sign in button - find the submit button in the email/password form
    const signInButton = page.locator('form').getByRole("button", { name: /sign in/i });
    await signInButton.click();
    
    // Wait for redirect to home page after successful login
    await page.waitForURL("/", { timeout: 10000 });
  }

  test.describe("Profile Page Access", () => {
    test("should redirect unauthenticated user to login when accessing profile page", async ({
      page,
    }) => {
      await page.goto("/profile");

      // Should redirect to login page with callbackUrl
      await expect(page).toHaveURL(/\/login/);
      const url = page.url();
      // URL may be encoded, so check for both encoded and decoded versions
      expect(url).toMatch(/callbackUrl=(%2Fprofile|\/profile)/);
    });

    test("should allow authenticated user to access profile page", async ({
      page,
    }) => {
      // Login as test user
      await loginAsTestUser(page);

      // Navigate to profile page
      await page.goto("/profile");

      // Should be able to access the page (not redirected to login)
      await expect(page).toHaveURL(/\/profile/);
      expect(page.url()).not.toContain("/login");

      // Verify profile page elements are visible
      await expect(page.getByRole("heading", { name: /profile settings/i })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[id="name"]')).toBeVisible();
      await expect(page.locator('textarea[id="bio"]')).toBeVisible();
    });
  });

  test.describe("Profile Update", () => {
    test("should display current profile information", async ({ page }) => {
      // Login as test user
      await loginAsTestUser(page);

      // Navigate to profile page
      await page.goto("/profile");

      // Verify profile fields are displayed with current data
      const emailInput = page.locator('input[type="email"]');
      const nameInput = page.locator('input[id="name"]');
      const bioTextarea = page.locator('textarea[id="bio"]');

      await expect(emailInput).toHaveValue(testUserEmail);
      await expect(nameInput).toHaveValue("E2E Test User");
      await expect(bioTextarea).toHaveValue("");
    });

    test("should update profile information", async ({ page }) => {
      // Login as test user
      await loginAsTestUser(page);

      // Navigate to profile page
      await page.goto("/profile");

      // Update name and bio
      const newName = "Updated Test User";
      const newBio = "This is my updated bio for E2E testing";

      await page.locator('input[id="name"]').fill(newName);
      await page.locator('textarea[id="bio"]').fill(newBio);

      // Submit form
      await page.getByRole("button", { name: /save changes/i }).click();

      // Wait for success message
      await expect(
        page.getByText(/profile updated successfully/i)
      ).toBeVisible({ timeout: 5000 });

      // Verify profile updates in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { name: true, bio: true },
      });

      expect(updatedUser?.name).toBe(newName);
      expect(updatedUser?.bio).toBe(newBio);

      // Verify UI shows updated values
      await expect(page.getByLabel(/name/i)).toHaveValue(newName);
      await expect(page.getByLabel(/bio/i)).toHaveValue(newBio);
    });

    test("should show validation errors for invalid input", async ({
      page,
    }) => {
      // Login as test user
      await loginAsTestUser(page);

      // Navigate to profile page
      await page.goto("/profile");

      // Try to enter name that's too long (over 100 characters)
      const longName = "a".repeat(101);
      const nameInput = page.locator('input[id="name"]');
      await nameInput.fill(longName);

      // Try to enter bio that's too long (over 500 characters)
      const longBio = "b".repeat(501);
      const bioTextarea = page.locator('textarea[id="bio"]');
      await bioTextarea.fill(longBio);

      // Submit form
      await page.getByRole("button", { name: /save changes/i }).click();

      // HTML5 maxLength should prevent entering more than 100 characters for name
      // and 500 characters for bio
      const nameValue = await nameInput.inputValue();
      const bioValue = await bioTextarea.inputValue();
      
      // HTML5 validation should limit the input
      expect(nameValue.length).toBeLessThanOrEqual(100);
      expect(bioValue.length).toBeLessThanOrEqual(500);
    });

    test("should clear bio when empty string is submitted", async ({ page, request }) => {
      // First, set a bio via API to ensure it's set
      await loginAsTestUser(page);
      await page.waitForTimeout(1000);
      
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find((c) =>
        c.name.includes("next-auth.session-token")
      );

      if (!sessionCookie) {
        throw new Error("Session cookie not found");
      }

      // Set bio via API
      await request.put("/api/profile", {
        data: { bio: "Some bio text" },
        headers: {
          Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
        },
      });

      // Verify bio was set
      let user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { bio: true },
      });
      expect(user?.bio).toBe("Some bio text");

      // Now clear bio via API
      await request.put("/api/profile", {
        data: { bio: "" },
        headers: {
          Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
        },
      });

      // Verify bio is cleared in database
      user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { bio: true },
      });
      expect(user?.bio).toBeNull();
    });
  });

  test.describe("Avatar Upload", () => {
    test("should upload avatar file", async ({ page }) => {
      // Login as test user
      await loginAsTestUser(page);

      // Navigate to profile page
      await page.goto("/profile");

      // Create a test image file (1x1 pixel PNG)
      const testImagePath = path.join(process.cwd(), "tests", "e2e", "test-avatar.jpg");
      const testImageBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      // Ensure directory exists
      const testDir = path.dirname(testImagePath);
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.writeFileSync(testImagePath, testImageBuffer);

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testImagePath);

      // Wait for upload button to appear
      await expect(
        page.getByRole("button", { name: /upload avatar/i })
      ).toBeVisible();

      // Click upload button
      await page.getByRole("button", { name: /upload avatar/i }).click();

      // Wait for success message
      await expect(
        page.getByText(/avatar uploaded successfully/i)
      ).toBeVisible({ timeout: 10000 });

      // Verify avatar is displayed
      const avatarImage = page.locator('img[alt="Avatar preview"]');
      await expect(avatarImage).toBeVisible();

      // Verify avatar path is saved in database
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { image: true },
      });
      expect(user?.image).toBeTruthy();
      expect(user?.image).toContain("uploads/");

      // Clean up test image file
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });

    test("should reject invalid file types", async ({ page }) => {
      // Login as test user
      await loginAsTestUser(page);

      // Navigate to profile page
      await page.goto("/profile");

      // Create a test PDF file (invalid type)
      const testPdfPath = path.join(process.cwd(), "tests", "e2e", "test-file.pdf");
      const testDir = path.dirname(testPdfPath);
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.writeFileSync(testPdfPath, "PDF content");

      // Try to upload PDF file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testPdfPath);

      // Wait for error message
      await expect(
        page.getByText(/file must be an image/i)
      ).toBeVisible({ timeout: 5000 });

      // Clean up test file
      if (fs.existsSync(testPdfPath)) {
        fs.unlinkSync(testPdfPath);
      }
    });

    test("should reject file too large", async ({ page }) => {
      // Login as test user
      await loginAsTestUser(page);

      // Navigate to profile page
      await page.goto("/profile");

      // Create a test file larger than 5MB
      const testLargeFilePath = path.join(process.cwd(), "tests", "e2e", "test-large.jpg");
      const testDir = path.dirname(testLargeFilePath);
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1); // 5MB + 1 byte
      fs.writeFileSync(testLargeFilePath, largeBuffer);

      // Try to upload large file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testLargeFilePath);

      // Wait for error message
      await expect(
        page.getByText(/file size must be less than 5mb/i)
      ).toBeVisible({ timeout: 5000 });

      // Clean up test file
      if (fs.existsSync(testLargeFilePath)) {
        fs.unlinkSync(testLargeFilePath);
      }
    });

    test("should replace old avatar when uploading new one", async ({
      page,
    }) => {
      // Login as test user
      await loginAsTestUser(page);

      // Navigate to profile page
      await page.goto("/profile");

      // Upload first avatar
      const testImage1Path = path.join(process.cwd(), "tests", "e2e", "test-avatar-1.jpg");
      const testImageBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      const testDir = path.dirname(testImage1Path);
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.writeFileSync(testImage1Path, testImageBuffer);

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testImage1Path);
      await expect(
        page.getByRole("button", { name: /upload avatar/i })
      ).toBeVisible();
      await page.getByRole("button", { name: /upload avatar/i }).click();
      await expect(
        page.getByText(/avatar uploaded successfully/i)
      ).toBeVisible({ timeout: 10000 });

      // Get first avatar path
      const user1 = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { image: true },
      });
      const firstAvatarPath = user1?.image;

      // Upload second avatar
      const testImage2Path = path.join(process.cwd(), "tests", "e2e", "test-avatar-2.jpg");
      fs.writeFileSync(testImage2Path, testImageBuffer);

      await fileInput.setInputFiles(testImage2Path);
      await expect(
        page.getByRole("button", { name: /upload avatar/i })
      ).toBeVisible();
      await page.getByRole("button", { name: /upload avatar/i }).click();
      await expect(
        page.getByText(/avatar uploaded successfully/i)
      ).toBeVisible({ timeout: 10000 });

      // Verify new avatar path is different
      const user2 = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { image: true },
      });
      const secondAvatarPath = user2?.image;

      expect(secondAvatarPath).toBeTruthy();
      expect(secondAvatarPath).not.toBe(firstAvatarPath);

      // Verify old avatar file is deleted (if it exists)
      if (firstAvatarPath) {
        const oldFilePath = path.join(process.cwd(), "public", firstAvatarPath);
        expect(fs.existsSync(oldFilePath)).toBe(false);
      }

      // Clean up test files
      if (fs.existsSync(testImage1Path)) {
        fs.unlinkSync(testImage1Path);
      }
      if (fs.existsSync(testImage2Path)) {
        fs.unlinkSync(testImage2Path);
      }
    });
  });

  test.describe("Profile API Endpoints", () => {
    test("should return 401 for unauthenticated GET /api/profile", async ({
      request,
    }) => {
      const response = await request.get("/api/profile");

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: {
          message: "Authentication required",
          code: "UNAUTHORIZED",
        },
      });
    });

    test("should return 401 for unauthenticated PUT /api/profile", async ({
      request,
    }) => {
      const response = await request.put("/api/profile", {
        data: { name: "Test" },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: {
          message: "Authentication required",
          code: "UNAUTHORIZED",
        },
      });
    });

    test("should return 401 for unauthenticated POST /api/profile/avatar", async ({
      request,
    }) => {
      const formData = new FormData();
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      formData.append("file", file);

      const response = await request.post("/api/profile/avatar", {
        multipart: formData,
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: {
          message: "Authentication required",
          code: "UNAUTHORIZED",
        },
      });
    });

    test("should return user profile for authenticated GET /api/profile", async ({
      request,
      page,
    }) => {
      // Login to get session cookie
      await loginAsTestUser(page);
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find((c) =>
        c.name.includes("next-auth.session-token")
      );

      if (!sessionCookie) {
        throw new Error("Session cookie not found");
      }

      // Make authenticated request
      const response = await request.get("/api/profile", {
        headers: {
          Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty("id");
      expect(body.data).toHaveProperty("email", testUserEmail);
      expect(body.data).toHaveProperty("name");
      expect(body.data).toHaveProperty("bio");
      expect(body.data).toHaveProperty("image");
      expect(body.data).toHaveProperty("role");
    });

    test("should update profile for authenticated PUT /api/profile", async ({
      request,
      page,
    }) => {
      // Login to get session cookie
      await loginAsTestUser(page);
      
      // Wait a bit for session to be established
      await page.waitForTimeout(1000);
      
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find((c) =>
        c.name.includes("next-auth.session-token")
      );

      if (!sessionCookie) {
        throw new Error("Session cookie not found");
      }

      // Update profile via API
      const updatedName = "API Updated Name";
      const updatedBio = "API Updated Bio";

      const response = await request.put("/api/profile", {
        data: {
          name: updatedName,
          bio: updatedBio,
        },
        headers: {
          Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(updatedName);
      expect(body.data.bio).toBe(updatedBio);

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { name: true, bio: true },
      });
      expect(user?.name).toBe(updatedName);
      expect(user?.bio).toBe(updatedBio);
    });
  });
});
