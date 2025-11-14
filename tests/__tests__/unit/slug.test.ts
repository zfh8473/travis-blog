import { describe, it, expect } from "@jest/globals";
import { generateSlug } from "@/lib/utils/slug";

describe("Slug Generation", () => {
  describe("generateSlug", () => {
    it("should convert title to lowercase", () => {
      const slug = generateSlug("Hello World");
      expect(slug).toBe("hello-world");
    });

    it("should replace spaces with hyphens", () => {
      const slug = generateSlug("My Article Title");
      expect(slug).toBe("my-article-title");
    });

    it("should remove special characters", () => {
      const slug = generateSlug("Hello, World!");
      expect(slug).toBe("hello-world");
    });

    it("should remove consecutive hyphens", () => {
      const slug = generateSlug("Multiple   Spaces");
      expect(slug).toBe("multiple-spaces");
    });

    it("should trim leading and trailing hyphens", () => {
      const slug = generateSlug("  Hello World  ");
      expect(slug).toBe("hello-world");
    });

    it("should handle special characters and spaces", () => {
      const slug = generateSlug("Article: Title (2024)");
      expect(slug).toBe("article-title-2024");
    });

    it("should preserve Chinese characters", () => {
      const slug = generateSlug("文章标题");
      expect(slug).toBe("文章标题");
    });

    it("should handle mixed Chinese and English", () => {
      const slug = generateSlug("Hello 世界 World");
      expect(slug).toBe("hello-世界-world");
    });

    it("should handle empty string", () => {
      const slug = generateSlug("");
      expect(slug).toBe("");
    });

    it("should handle only special characters", () => {
      const slug = generateSlug("!!!@@@###");
      expect(slug).toBe("");
    });
  });
});

