import { createCommentSchema, getCommentsSchema } from "@/lib/validations/comment";

describe("Comment Validation", () => {
  describe("createCommentSchema", () => {
    it("should validate a valid logged-in user comment", () => {
      const result = createCommentSchema.safeParse({
        content: "Great article!",
        articleId: "article-123",
        userId: "user-456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Great article!");
        expect(result.data.articleId).toBe("article-123");
        expect(result.data.userId).toBe("user-456");
      }
    });

    it("should validate a valid anonymous user comment", () => {
      const result = createCommentSchema.safeParse({
        content: "Nice post!",
        articleId: "article-123",
        userId: null,
        authorName: "Anonymous User",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Nice post!");
        expect(result.data.authorName).toBe("Anonymous User");
      }
    });

    it("should reject empty content", () => {
      const result = createCommentSchema.safeParse({
        content: "",
        articleId: "article-123",
        userId: "user-456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues || [];
        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0]?.message).toContain("required");
      }
    });

    it("should reject content exceeding 5000 characters", () => {
      const longContent = "a".repeat(5001);
      const result = createCommentSchema.safeParse({
        content: longContent,
        articleId: "article-123",
        userId: "user-456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues || [];
        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0]?.message).toContain("5000");
      }
    });

    it("should reject anonymous comment without authorName", () => {
      const result = createCommentSchema.safeParse({
        content: "Comment without name",
        articleId: "article-123",
        userId: null,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues || [];
        expect(issues.length).toBeGreaterThan(0);
        const authorNameError = issues.find(
          (e) => e.path && e.path.includes("authorName")
        );
        expect(authorNameError).toBeDefined();
      }
    });

    it("should accept comment with parentId (reply)", () => {
      const result = createCommentSchema.safeParse({
        content: "This is a reply",
        articleId: "article-123",
        userId: "user-456",
        parentId: "comment-789",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parentId).toBe("comment-789");
      }
    });
  });

  describe("getCommentsSchema", () => {
    it("should validate a valid articleId", () => {
      const result = getCommentsSchema.safeParse({
        articleId: "article-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.articleId).toBe("article-123");
      }
    });

    it("should reject empty articleId", () => {
      const result = getCommentsSchema.safeParse({
        articleId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues || [];
        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0]?.message).toContain("required");
      }
    });
  });
});

