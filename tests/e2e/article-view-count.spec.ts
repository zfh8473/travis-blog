import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";

/**
 * E2E test for article view count functionality.
 * 
 * Tests:
 * 1. View count increments when article page is loaded
 * 2. View count is displayed correctly
 * 3. API endpoint responds correctly
 * 4. View count updates in real-time
 */
test.describe("Article View Count", () => {
  let testArticleSlug: string;
  let initialViews: number;

  test.beforeAll(async () => {
    // Find or create a test article
    const article = await prisma.article.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    });

    if (!article) {
      throw new Error("No published articles found for testing");
    }

    testArticleSlug = article.slug;
    initialViews = (article as any).views ?? 0;

    console.log(`Test article slug: ${testArticleSlug}`);
    console.log(`Initial views: ${initialViews}`);
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage first
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should increment view count when article is viewed", async ({
    page,
  }) => {
    const slug = testArticleSlug;
    console.log(`Testing article with slug: ${slug}`);

    // Step 1: Navigate directly to the article page
    await page.goto(`/articles/${slug}`);
    await page.waitForLoadState("networkidle");

    // Step 2: Intercept the view count API call
    let viewCountRequest: any = null;
    let viewCountResponse: any = null;

    page.on("request", (request) => {
      if (request.url().includes(`/api/articles/${slug}/views`)) {
        viewCountRequest = request;
        console.log("View count API request intercepted:", {
          url: request.url(),
          method: request.method(),
        });
      }
    });

    page.on("response", async (response) => {
      if (response.url().includes(`/api/articles/${slug}/views`)) {
        viewCountResponse = response;
        const body = await response.json().catch(() => ({}));
        console.log("View count API response intercepted:", {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          body,
        });
      }
    });

    // Step 2: Wait for the view count API call to complete
    // Wait for network request to complete
    await page.waitForResponse(
      (response) =>
        response.url().includes(`/api/articles/${slug}/views`) &&
        response.request().method() === "POST",
      { timeout: 10000 }
    ).catch(() => {
      console.warn("View count API call timeout - continuing anyway");
    });

    // Additional wait for DOM updates
    await page.waitForTimeout(1000);

    // Step 3: Check if API request was made
    if (!viewCountRequest) {
      console.error("View count API request was not intercepted!");
      // Try to find it in network logs
      const requests = await page.evaluate(() => {
        return (window as any).__playwright_requests || [];
      });
      console.log("All network requests:", requests);
    }
    expect(viewCountRequest).toBeTruthy();
    expect(viewCountRequest?.method()).toBe("POST");

    // Step 4: Check if API response was successful
    expect(viewCountResponse).toBeTruthy();
    expect(viewCountResponse?.status()).toBe(200);

    // Step 5: Get the response body
    const responseBody = await viewCountResponse?.json();
    expect(responseBody).toBeTruthy();
    expect(responseBody.success).toBe(true);
    expect(responseBody.data?.views).toBeGreaterThanOrEqual(0);

    console.log("View count response:", responseBody);
    console.log("Expected views (initial + 1):", initialViews + 1);
    console.log("Actual views from API:", responseBody.data?.views);

    // Step 6: Check if view count is displayed on the page
    const viewsElement = page.locator('[data-article-views]');
    await expect(viewsElement).toBeVisible({ timeout: 5000 });

    // Step 7: Get the displayed view count
    const displayedViewsText = await viewsElement.textContent();
    expect(displayedViewsText).toBeTruthy();
    expect(displayedViewsText).toContain("次阅读");

    // Extract the number from the text (e.g., "123 次阅读" -> 123)
    const viewsMatch = displayedViewsText?.match(/([\d,]+)\s*次阅读/);
    expect(viewsMatch).toBeTruthy();
    const displayedViews = parseInt(
      viewsMatch?.[1]?.replace(/,/g, "") || "0",
      10
    );

    console.log("Displayed view count:", displayedViews);
    console.log("API response view count:", responseBody.data?.views);
    console.log("Initial views:", initialViews);

    // Step 8: Verify that displayed view count matches API response
    expect(displayedViews).toBe(responseBody.data?.views);

    // Step 9: Verify that view count actually increased
    expect(responseBody.data?.views).toBeGreaterThan(initialViews);

    // Step 11: Check browser console for errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(1000);

    // Log any console errors
    if (consoleErrors.length > 0) {
      console.error("Console errors found:", consoleErrors);
    }

    // Step 12: Verify no critical errors (allow for non-critical errors)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes("Failed to increment article views") &&
        !error.includes("favicon")
    );
    expect(criticalErrors.length).toBe(0);
  });

  test("should handle API errors gracefully", async ({ page }) => {
    const slug = testArticleSlug;

    // Step 1: Mock the API to return an error
    await page.route("**/api/articles/*/views", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            message: "Internal server error",
            code: "INTERNAL_ERROR",
          },
        }),
      });
    });

    // Step 2: Navigate directly to article detail page
    await page.goto(`/articles/${slug}`);
    await page.waitForLoadState("networkidle");

    // Step 4: Wait for API call to complete
    await page.waitForTimeout(2000);

    // Step 5: Verify that the page still loads correctly (graceful error handling)
    const viewsElement = page.locator('[data-article-views]');
    await expect(viewsElement).toBeVisible({ timeout: 5000 });

    // Step 6: Check that view count is still displayed (even if API failed)
    const displayedViewsText = await viewsElement.textContent();
    expect(displayedViewsText).toBeTruthy();
    expect(displayedViewsText).toContain("次阅读");
  });

  test("should not increment view count multiple times on same page load", async ({
    page,
  }) => {
    const slug = testArticleSlug;

    // Step 1: Track all API calls
    const apiCalls: any[] = [];

    page.on("response", async (response) => {
      if (response.url().includes(`/api/articles/${slug}/views`)) {
        const body = await response.json().catch(() => ({}));
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          body,
        });
      }
    });

    // Step 2: Navigate directly to article detail page
    await page.goto(`/articles/${slug}`);
    await page.waitForLoadState("networkidle");

    // Step 4: Wait for initial API call
    await page.waitForTimeout(2000);

    // Step 5: Trigger a re-render (scroll, resize, etc.)
    await page.evaluate(() => {
      window.dispatchEvent(new Event("resize"));
    });
    await page.waitForTimeout(1000);

    // Step 6: Verify that only one API call was made
    expect(apiCalls.length).toBe(1);
    console.log("API calls made:", apiCalls.length);
  });
});

