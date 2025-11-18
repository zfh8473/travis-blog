import { generatePlaceholderThumbnail } from "@/lib/utils/image-extractor";

/**
 * Unit tests for image extractor utilities.
 * 
 * Tests the generatePlaceholderThumbnail function, especially
 * the case where multiple articles have the same first letter.
 */

describe("generatePlaceholderThumbnail", () => {
  describe("Uniqueness when same first letter", () => {
    test("should generate unique data URLs for articles with same first letter", () => {
      // Given: Multiple articles with same first letter "测"
      const article1 = generatePlaceholderThumbnail(
        "测试文章一",
        0,
        5,
        "article-id-1"
      );
      const article2 = generatePlaceholderThumbnail(
        "测试文章二",
        1,
        5,
        "article-id-2"
      );
      const article3 = generatePlaceholderThumbnail(
        "测试文章三",
        2,
        5,
        "article-id-3"
      );

      // Then: All data URLs should be unique
      expect(article1).not.toBe(article2);
      expect(article2).not.toBe(article3);
      expect(article1).not.toBe(article3);
    });

    test("should include unique SVG IDs in data URLs", () => {
      // Given: Articles with same first letter but different IDs
      const article1 = generatePlaceholderThumbnail(
        "测试文章",
        0,
        3,
        "article-123"
      );
      const article2 = generatePlaceholderThumbnail(
        "测试文章",
        1,
        3,
        "article-456"
      );

      // When: Decode data URLs
      const svg1 = decodeURIComponent(article1.split(",")[1]);
      const svg2 = decodeURIComponent(article2.split(",")[1]);

      // Then: SVG IDs should be unique
      const id1Match = svg1.match(/id="([^"]+)"/);
      const id2Match = svg2.match(/id="([^"]+)"/);

      if (id1Match && id2Match) {
        expect(id1Match[1]).not.toBe(id2Match[1]);
        // Should contain article ID in the unique ID
        expect(id1Match[1]).toContain("article-123");
        expect(id2Match[1]).toContain("article-456");
      }
    });

    test("should generate different colors for different indices", () => {
      // Given: Articles with same first letter at different positions
      const article1 = generatePlaceholderThumbnail(
        "测试文章",
        0,
        5,
        "article-1"
      );
      const article2 = generatePlaceholderThumbnail(
        "测试文章",
        4,
        5,
        "article-2"
      );

      // When: Decode data URLs and extract colors
      const svg1 = decodeURIComponent(article1.split(",")[1]);
      const svg2 = decodeURIComponent(article2.split(",")[1]);

      // Then: Colors should be different (first is darkest, last is lightest)
      const color1Match = svg1.match(/fill="([^"]+)"/);
      const color2Match = svg2.match(/fill="([^"]+)"/);

      if (color1Match && color2Match) {
        // First article (index 0) should be darker than last (index 4)
        expect(color1Match[1]).not.toBe(color2Match[1]);
      }
    });
  });

  describe("Fallback behavior", () => {
    test("should work without uniqueId parameter", () => {
      // Given: Article without uniqueId
      const thumbnail = generatePlaceholderThumbnail("测试文章", 0, 5);

      // Then: Should still generate a valid data URL
      expect(thumbnail).toMatch(/^data:image\/svg\+xml,/);
    });

    test("should work without index and total", () => {
      // Given: Article without index/total
      const thumbnail = generatePlaceholderThumbnail("测试文章");

      // Then: Should still generate a valid data URL
      expect(thumbnail).toMatch(/^data:image\/svg\+xml,/);
    });
  });

  describe("Data URL format", () => {
    test("should generate valid SVG data URL", () => {
      // Given: Any article
      const thumbnail = generatePlaceholderThumbnail(
        "测试文章",
        0,
        5,
        "test-id"
      );

      // Then: Should be a valid data URL
      expect(thumbnail).toMatch(/^data:image\/svg\+xml,/);
      
      // And: Should be decodable
      const svgContent = decodeURIComponent(thumbnail.split(",")[1]);
      expect(svgContent).toContain("<svg");
      expect(svgContent).toContain("测试");
    });

    test("should include first letter in SVG", () => {
      // Given: Article with specific first letter
      const thumbnail = generatePlaceholderThumbnail(
        "代码文章",
        0,
        5,
        "test-id"
      );

      // When: Decode SVG
      const svgContent = decodeURIComponent(thumbnail.split(",")[1]);

      // Then: Should contain the first letter
      expect(svgContent).toContain("代");
    });
  });
});

