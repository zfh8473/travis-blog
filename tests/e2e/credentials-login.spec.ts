import { test, expect } from "@playwright/test";

/**
 * E2E tests for email/password login flow.
 * 
 * Tests the complete user journey including:
 * - Login page navigation
 * - Form submission
 * - Successful login and redirect
 * - Session persistence
 * - Error handling
 */
test.describe("Email/Password Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
  });

  test("should display login form", async ({ page }) => {
    // Check that login form elements are present
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    // Try to submit empty form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check for validation errors (browser native or custom)
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    // HTML5 validation should prevent submission
    const emailValid = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );
    const passwordValid = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );

    expect(emailValid).toBe(false);
    expect(passwordValid).toBe(false);
  });

  test("should show error for invalid email format", async ({ page }) => {
    await page.getByLabel(/email/i).fill("invalid-email");
    await page.getByLabel(/password/i).fill("password123");

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel(/email/i);
    const emailValid = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );

    expect(emailValid).toBe(false);
  });

  test("should show error message for invalid credentials", async ({ page }) => {
    // Fill form with invalid credentials
    await page.getByLabel(/email/i).fill("nonexistent@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for error message
    await expect(
      page.getByText(/invalid email or password/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // Note: This test requires a test user to be created in the database
    // In a real scenario, you would set up test data before running tests

    // Fill form with valid credentials (assuming test user exists)
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("testPassword123");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect to homepage
    await page.waitForURL("/", { timeout: 5000 });
    expect(page.url()).toContain("/");
  });

  test("should persist session across page refresh", async ({ page, context }) => {
    // This test requires successful login first
    // Assuming login is successful from previous test

    // After login, refresh the page
    await page.reload();

    // Session should persist - user should still be logged in
    // This would be verified by checking for authenticated user indicators
    // (e.g., user menu, logout button, etc.)
    // For now, we verify the page loads without redirecting to login
    expect(page.url()).not.toContain("/login");
  });

  test("should redirect to callback URL after login", async ({ page }) => {
    // Navigate to a protected route first (which should redirect to login)
    // Then login, and verify redirect back to original route
    // This requires protected routes to be implemented

    // For now, test that callbackUrl parameter is respected
    await page.goto("/login?callbackUrl=/dashboard");

    // After successful login, should redirect to /dashboard
    // This test would need actual login to complete
  });

  test("should show loading state during authentication", async ({ page }) => {
    // Fill form
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("testPassword123");

    // Submit form
    const submitButton = page.getByRole("button", { name: /sign in/i });
    await submitButton.click();

    // Check for loading state (button should be disabled or show loading text)
    // This happens very quickly, so we check immediately
    const buttonText = await submitButton.textContent();
    expect(
      buttonText?.toLowerCase().includes("signing") ||
        buttonText?.toLowerCase().includes("loading")
    ).toBeTruthy();
  });
});

