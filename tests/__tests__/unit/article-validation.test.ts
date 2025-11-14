import { describe, it, expect } from "@jest/globals";
import {
  createArticleSchema,
  updateArticleSchema,
  ArticleStatus,
} from "@/lib/validations/article";

describe("Article Validation Schemas", () => {
  describe("createArticleSchema", () => {
    it("should validate valid article data", () => {
      const validData = {
        title: "My Article",
        content: "<p>Article content</p>",
        excerpt: "Article excerpt",
        status: ArticleStatus.PUBLISHED,
      };

      const result = createArticleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate article with optional fields", () => {
      const validData = {
        title: "My Article",
        content: "<p>Article content</p>",
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        tagIds: [
          "123e4567-e89b-12d3-a456-426614174001",
          "123e4567-e89b-12d3-a456-426614174002",
        ],
        status: ArticleStatus.DRAFT,
      };

      const result = createArticleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalidData = {
        title: "",
        content: "<p>Article content</p>",
        status: ArticleStatus.PUBLISHED,
      };

      const result = createArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject title longer than 200 characters", () => {
      const invalidData = {
        title: "a".repeat(201),
        content: "<p>Article content</p>",
        status: ArticleStatus.PUBLISHED,
      };

      const result = createArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty content", () => {
      const invalidData = {
        title: "My Article",
        content: "",
        status: ArticleStatus.PUBLISHED,
      };

      const result = createArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject excerpt longer than 500 characters", () => {
      const invalidData = {
        title: "My Article",
        content: "<p>Article content</p>",
        excerpt: "a".repeat(501),
        status: ArticleStatus.PUBLISHED,
      };

      const result = createArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid categoryId (not UUID)", () => {
      const invalidData = {
        title: "My Article",
        content: "<p>Article content</p>",
        categoryId: "invalid-uuid",
        status: ArticleStatus.PUBLISHED,
      };

      const result = createArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const invalidData = {
        title: "My Article",
        content: "<p>Article content</p>",
        status: "INVALID_STATUS",
      };

      const result = createArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing status", () => {
      const invalidData = {
        title: "My Article",
        content: "<p>Article content</p>",
      };

      const result = createArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("updateArticleSchema", () => {
    it("should validate partial update with only title", () => {
      const validData = {
        title: "Updated Title",
      };

      const result = updateArticleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate partial update with only status", () => {
      const validData = {
        status: ArticleStatus.PUBLISHED,
      };

      const result = updateArticleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate empty object (no updates)", () => {
      const validData = {};

      const result = updateArticleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const invalidData = {
        title: "",
      };

      const result = updateArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject title longer than 200 characters", () => {
      const invalidData = {
        title: "a".repeat(201),
      };

      const result = updateArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty content", () => {
      const invalidData = {
        content: "",
      };

      const result = updateArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const invalidData = {
        status: "INVALID_STATUS",
      };

      const result = updateArticleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

