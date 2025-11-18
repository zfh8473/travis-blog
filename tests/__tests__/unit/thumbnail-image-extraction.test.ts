/**
 * Unit tests for thumbnail image extraction functionality.
 * 
 * Tests the behavior of extractFirstImage and thumbnail generation
 * when articles contain images in their content.
 */

import { extractFirstImage, generatePlaceholderThumbnail } from "@/lib/utils/image-extractor";

describe("Thumbnail Image Extraction", () => {
  describe("extractFirstImage", () => {
    it("should extract image URL from HTML img tag", () => {
      const html = '<p>Some text</p><img src="/uploads/test.jpg" alt="Test" /><p>More text</p>';
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/test.jpg");
    });

    it("should extract image URL with single quotes", () => {
      const html = "<img src='/uploads/test.png' alt='Test' />";
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/test.png");
    });

    it("should extract image URL from background-image style", () => {
      const html = '<div style="background-image: url(/uploads/bg.jpg)"></div>';
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/bg.jpg");
    });

    it("should extract image URL from background-image with quotes", () => {
      const html = '<div style="background-image: url(\'/uploads/bg.jpg\')"></div>';
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/bg.jpg");
    });

    it("should return null when no image found", () => {
      const html = "<p>No images here</p>";
      const result = extractFirstImage(html);
      expect(result).toBeNull();
    });

    it("should return null for empty content", () => {
      const result = extractFirstImage("");
      expect(result).toBeNull();
    });

    it("should return null for null content", () => {
      const result = extractFirstImage(null as any);
      expect(result).toBeNull();
    });

    it("should extract first image when multiple images exist", () => {
      const html = '<img src="/uploads/first.jpg" /><img src="/uploads/second.jpg" />';
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/first.jpg");
    });

    it("should handle Markdown image syntax converted to HTML", () => {
      // Markdown: ![alt](url) converts to <img src="url" alt="alt" />
      const html = '<p>Text before</p><img src="https://example.com/image.jpg" alt="alt text" /><p>Text after</p>';
      const result = extractFirstImage(html);
      expect(result).toBe("https://example.com/image.jpg");
    });

    it("should handle Vercel Blob Storage URLs", () => {
      const html = '<img src="https://xxx.public.blob.vercel-storage.com/image.jpg" alt="Test" />';
      const result = extractFirstImage(html);
      expect(result).toBe("https://xxx.public.blob.vercel-storage.com/image.jpg");
    });

    it("should handle base64 data URLs", () => {
      const html = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Test" />';
      const result = extractFirstImage(html);
      expect(result).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
    });

    it("should handle relative paths", () => {
      const html = '<img src="../uploads/image.png" alt="Test" />';
      const result = extractFirstImage(html);
      expect(result).toBe("../uploads/image.png");
    });
  });

  describe("generatePlaceholderThumbnail", () => {
    it("should generate placeholder for article without image", () => {
      const result = generatePlaceholderThumbnail("Test Article", 0, 5);
      expect(result).toMatch(/^data:image\/svg\+xml,/);
      expect(result).toContain("Test Article".charAt(0).toUpperCase());
    });

    it("should generate different placeholders for different indices", () => {
      const result1 = generatePlaceholderThumbnail("Article 1", 0, 5);
      const result2 = generatePlaceholderThumbnail("Article 2", 1, 5);
      expect(result1).not.toBe(result2);
    });

    it("should generate placeholder with first letter", () => {
      const result = generatePlaceholderThumbnail("测试文章", 0, 1);
      // SVG is URL encoded, so we decode it to check content
      const decoded = decodeURIComponent(result);
      expect(decoded).toContain("测");
    });
  });

  describe("Thumbnail selection logic (integration)", () => {
    it("should prefer extracted image over placeholder", () => {
      const html = '<img src="/uploads/test.jpg" alt="Test" />';
      const extracted = extractFirstImage(html);
      const placeholder = generatePlaceholderThumbnail("Test Article", 0, 1);
      
      const thumbnailUrl = extracted || placeholder;
      
      expect(thumbnailUrl).toBe("/uploads/test.jpg");
      expect(thumbnailUrl).not.toBe(placeholder);
    });

    it("should use placeholder when no image found", () => {
      const html = "<p>No images</p>";
      const extracted = extractFirstImage(html);
      const placeholder = generatePlaceholderThumbnail("Test Article", 0, 1);
      
      const thumbnailUrl = extracted || placeholder;
      
      expect(thumbnailUrl).toBe(placeholder);
      expect(thumbnailUrl).toMatch(/^data:image\/svg\+xml,/);
    });

    it("should handle empty content gracefully", () => {
      const extracted = extractFirstImage("");
      const placeholder = generatePlaceholderThumbnail("Test Article", 0, 1);
      
      const thumbnailUrl = extracted || placeholder;
      
      expect(thumbnailUrl).toBe(placeholder);
    });

    it("should handle null content gracefully", () => {
      const extracted = extractFirstImage(null as any);
      const placeholder = generatePlaceholderThumbnail("Test Article", 0, 1);
      
      const thumbnailUrl = extracted || placeholder;
      
      expect(thumbnailUrl).toBe(placeholder);
    });
  });

  describe("Edge cases and potential issues", () => {
    it("should handle image URLs with special characters", () => {
      const html = '<img src="/uploads/test%20image.jpg" alt="Test" />';
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/test%20image.jpg");
    });

    it("should handle image URLs with query parameters", () => {
      const html = '<img src="/uploads/test.jpg?v=123&size=large" alt="Test" />';
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/test.jpg?v=123&size=large");
    });

    it("should handle malformed HTML gracefully", () => {
      const html = '<img src="/uploads/test.jpg" alt="Test"';
      const result = extractFirstImage(html);
      // Malformed HTML might not match the regex, but function should not crash
      // This test verifies the function handles edge cases gracefully
      expect(result === null || typeof result === "string").toBe(true);
    });

    it("should handle very long HTML content", () => {
      const longContent = "<p>" + "a".repeat(10000) + "</p><img src=\"/uploads/test.jpg\" alt=\"Test\" />";
      const result = extractFirstImage(longContent);
      expect(result).toBe("/uploads/test.jpg");
    });

    it("should handle multiple image formats", () => {
      const formats = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
      formats.forEach((format) => {
        const html = `<img src="/uploads/test.${format}" alt="Test" />`;
        const result = extractFirstImage(html);
        expect(result).toBe(`/uploads/test.${format}`);
      });
    });
  });

  describe("Markdown editor image insertion scenarios", () => {
    it("should extract image from Markdown editor output (HTML)", () => {
      // When user inserts image via Markdown editor, it converts to HTML
      const markdownHtml = '<p>Some content</p><img src="/uploads/inserted-image.jpg" alt="Inserted" /><p>More content</p>';
      const result = extractFirstImage(markdownHtml);
      expect(result).toBe("/uploads/inserted-image.jpg");
    });

    it("should handle image inserted at the beginning", () => {
      const html = '<img src="/uploads/first.jpg" alt="First" /><p>Content after</p>';
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/first.jpg");
    });

    it("should handle image inserted at the end", () => {
      const html = '<p>Content before</p><img src="/uploads/last.jpg" alt="Last" />';
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/last.jpg");
    });

    it("should handle image inserted in the middle", () => {
      const html = '<p>Before</p><img src="/uploads/middle.jpg" alt="Middle" /><p>After</p>';
      const result = extractFirstImage(html);
      expect(result).toBe("/uploads/middle.jpg");
    });
  });
});

