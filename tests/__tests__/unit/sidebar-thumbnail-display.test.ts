/**
 * Unit tests for sidebar thumbnail display logic.
 * 
 * Tests the behavior when articles contain images and how thumbnails are displayed.
 * This test investigates why thumbnails fail to display when articles have images.
 */

import { extractFirstImage, generatePlaceholderThumbnail } from "@/lib/utils/image-extractor";

describe("Sidebar Thumbnail Display Logic", () => {
  describe("Thumbnail URL selection", () => {
    it("should use extracted image URL when article has image", () => {
      const articleContent = '<p>Some text</p><img src="/uploads/test.jpg" alt="Test" /><p>More text</p>';
      const thumbnailUrl = extractFirstImage(articleContent) || generatePlaceholderThumbnail("Test Article", 0, 1);
      
      expect(thumbnailUrl).toBe("/uploads/test.jpg");
      expect(thumbnailUrl).not.toMatch(/^data:image\/svg\+xml,/);
    });

    it("should use placeholder when article has no image", () => {
      const articleContent = "<p>No images here</p>";
      const thumbnailUrl = extractFirstImage(articleContent) || generatePlaceholderThumbnail("Test Article", 0, 1);
      
      expect(thumbnailUrl).toMatch(/^data:image\/svg\+xml,/);
    });

    it("should handle empty content", () => {
      const articleContent = "";
      const thumbnailUrl = extractFirstImage(articleContent) || generatePlaceholderThumbnail("Test Article", 0, 1);
      
      expect(thumbnailUrl).toMatch(/^data:image\/svg\+xml,/);
    });

    it("should handle null content", () => {
      const articleContent = null as any;
      const thumbnailUrl = extractFirstImage(articleContent) || generatePlaceholderThumbnail("Test Article", 0, 1);
      
      expect(thumbnailUrl).toMatch(/^data:image\/svg\+xml,/);
    });
  });

  describe("Image URL format detection", () => {
    it("should detect data URI correctly", () => {
      const dataUri = "data:image/svg+xml,%3Csvg%3E%3C%2Fsvg%3E";
      expect(dataUri.startsWith("data:")).toBe(true);
    });

    it("should detect regular image URLs correctly", () => {
      const imageUrl = "/uploads/test.jpg";
      expect(imageUrl.startsWith("data:")).toBe(false);
    });

    it("should detect absolute URLs correctly", () => {
      const absoluteUrl = "https://example.com/image.jpg";
      expect(absoluteUrl.startsWith("data:")).toBe(false);
    });

    it("should detect Vercel Blob Storage URLs correctly", () => {
      const blobUrl = "https://xxx.public.blob.vercel-storage.com/image.jpg";
      expect(blobUrl.startsWith("data:")).toBe(false);
    });
  });

  describe("Potential issues with image URLs", () => {
    it("should handle relative paths from extractFirstImage", () => {
      const html = '<img src="/uploads/test.jpg" alt="Test" />';
      const imageUrl = extractFirstImage(html);
      
      expect(imageUrl).toBe("/uploads/test.jpg");
      // Relative paths should work with Next.js Image component if they're in public folder
      // But if images are stored elsewhere (e.g., Vercel Blob), they need to be absolute URLs
      expect(imageUrl?.startsWith("/")).toBe(true);
    });

    it("should handle absolute URLs from extractFirstImage", () => {
      const html = '<img src="https://example.com/image.jpg" alt="Test" />';
      const imageUrl = extractFirstImage(html);
      
      expect(imageUrl).toBe("https://example.com/image.jpg");
      expect(imageUrl?.startsWith("http")).toBe(true);
    });

    it("should handle Vercel Blob Storage URLs", () => {
      const html = '<img src="https://xxx.public.blob.vercel-storage.com/image.jpg" alt="Test" />';
      const imageUrl = extractFirstImage(html);
      
      expect(imageUrl).toBe("https://xxx.public.blob.vercel-storage.com/image.jpg");
      expect(imageUrl?.startsWith("https://")).toBe(true);
    });

    it("should handle base64 data URLs", () => {
      const html = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Test" />';
      const imageUrl = extractFirstImage(html);
      
      expect(imageUrl).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
      expect(imageUrl?.startsWith("data:")).toBe(true);
    });
  });

  describe("Sidebar rendering logic simulation", () => {
    it("should render img tag for data URI", () => {
      const thumbnailUrl = generatePlaceholderThumbnail("Test", 0, 1);
      const shouldUseImgTag = thumbnailUrl.startsWith("data:");
      
      expect(shouldUseImgTag).toBe(true);
      expect(thumbnailUrl).toMatch(/^data:image\/svg\+xml,/);
    });

    it("should render Image component for regular URLs", () => {
      const thumbnailUrl = "/uploads/test.jpg";
      const shouldUseImgTag = thumbnailUrl.startsWith("data:");
      
      expect(shouldUseImgTag).toBe(false);
      // Next.js Image component requires proper configuration for external domains
      // or images must be in the public folder for relative paths
    });

    it("should handle case when extractFirstImage returns URL but Image component fails", () => {
      // This simulates the scenario where extractFirstImage returns a URL,
      // but Next.js Image component cannot load it (e.g., wrong domain, 404, etc.)
      const articleContent = '<img src="/uploads/nonexistent.jpg" alt="Test" />';
      const thumbnailUrl = extractFirstImage(articleContent);
      
      expect(thumbnailUrl).toBe("/uploads/nonexistent.jpg");
      // In this case, the Image component would fail to load,
      // but there's no fallback to placeholder
      // This might be the issue!
    });

    it("should handle case when extractFirstImage returns invalid URL", () => {
      // Test with various invalid URL formats
      const testCases = [
        { url: "invalid-url", expected: "invalid-url" },
        { url: "//invalid", expected: "//invalid" },
        { url: "http://", expected: "http://" },
        { url: "https://", expected: "https://" },
        // Empty string might not match the regex
        { url: "", expected: null },
      ];

      testCases.forEach(({ url, expected }) => {
        const html = `<img src="${url}" alt="Test" />`;
        const extracted = extractFirstImage(html);
        expect(extracted).toBe(expected);
      });
    });
  });

  describe("Markdown editor image insertion scenarios", () => {
    it("should extract image from Markdown editor HTML output", () => {
      // When user inserts image via Markdown editor, it's saved as HTML
      const markdownHtml = '<p>Content</p><img src="/uploads/inserted.jpg" alt="Inserted" /><p>More</p>';
      const thumbnailUrl = extractFirstImage(markdownHtml) || generatePlaceholderThumbnail("Test", 0, 1);
      
      expect(thumbnailUrl).toBe("/uploads/inserted.jpg");
    });

    it("should handle image inserted via drag-and-drop", () => {
      // Drag-and-drop might insert images with specific URL format
      const html = '<img src="https://xxx.public.blob.vercel-storage.com/dragged-image.jpg" alt="Dragged" />';
      const thumbnailUrl = extractFirstImage(html) || generatePlaceholderThumbnail("Test", 0, 1);
      
      expect(thumbnailUrl).toBe("https://xxx.public.blob.vercel-storage.com/dragged-image.jpg");
    });

    it("should handle image inserted via paste", () => {
      // Paste might insert images with base64 data URLs or uploaded URLs
      const html = '<img src="https://xxx.public.blob.vercel-storage.com/pasted-image.jpg" alt="Pasted" />';
      const thumbnailUrl = extractFirstImage(html) || generatePlaceholderThumbnail("Test", 0, 1);
      
      expect(thumbnailUrl).toBe("https://xxx.public.blob.vercel-storage.com/pasted-image.jpg");
    });
  });

  describe("Next.js Image component requirements", () => {
    it("should identify URLs that need next.config.js domain configuration", () => {
      const externalUrls = [
        "https://example.com/image.jpg",
        "https://xxx.public.blob.vercel-storage.com/image.jpg",
        "http://localhost:3000/image.jpg",
      ];

      externalUrls.forEach((url) => {
        const isExternal = url.startsWith("http://") || url.startsWith("https://");
        expect(isExternal).toBe(true);
        // These URLs require next.config.js images.domains or images.remotePatterns configuration
      });
    });

    it("should identify relative paths that should work with Next.js Image", () => {
      const relativeUrls = [
        "/uploads/image.jpg",
        "/images/test.png",
        "/static/photo.jpg",
      ];

      relativeUrls.forEach((url) => {
        const isRelative = url.startsWith("/") && !url.startsWith("//");
        expect(isRelative).toBe(true);
        // These should work if files are in the public folder
        // But if using Vercel Blob Storage, relative paths won't work
      });
    });
  });
});

