/**
 * Unit tests for profile validation schemas.
 * 
 * Tests the validation schemas in lib/validations/profile.ts
 * including profileUpdateSchema and avatarUploadSchema.
 */

import { profileUpdateSchema, avatarUploadSchema } from "@/lib/validations/profile";

describe("Profile Validation Schemas", () => {
  describe("profileUpdateSchema", () => {
    it("should accept valid profile update data", () => {
      const validData = {
        name: "John Doe",
        bio: "Software developer",
        image: "uploads/avatar.jpg",
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("John Doe");
        expect(result.data.bio).toBe("Software developer");
        expect(result.data.image).toBe("uploads/avatar.jpg");
      }
    });

    it("should accept partial profile update data", () => {
      const partialData = {
        name: "John Doe",
      };

      const result = profileUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("should accept empty profile update data", () => {
      const emptyData = {};

      const result = profileUpdateSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    it("should reject name longer than 100 characters", () => {
      const invalidData = {
        name: "a".repeat(101),
      };

      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100");
      }
    });

    it("should reject bio longer than 500 characters", () => {
      const invalidData = {
        bio: "a".repeat(501),
      };

      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("500");
      }
    });

    it("should accept empty string for name (clears name)", () => {
      const data = {
        name: "",
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept empty string for bio (clears bio)", () => {
      const data = {
        bio: "",
      };

      const result = profileUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("avatarUploadSchema", () => {
    it("should accept valid image file", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: 1024 }); // 1KB

      const result = avatarUploadSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it("should reject non-image file", () => {
      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      Object.defineProperty(file, "size", { value: 1024 });

      const result = avatarUploadSchema.safeParse({ file });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("image");
      }
    });

    it("should reject file larger than 5MB", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 + 1 }); // 5MB + 1 byte

      const result = avatarUploadSchema.safeParse({ file });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("5MB");
      }
    });

    it("should accept file exactly 5MB", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 }); // Exactly 5MB

      const result = avatarUploadSchema.safeParse({ file });
      expect(result.success).toBe(true);
    });

    it("should accept different image types", () => {
      const types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      types.forEach((type) => {
        const file = new File(["test"], "test.jpg", { type });
        Object.defineProperty(file, "size", { value: 1024 });

        const result = avatarUploadSchema.safeParse({ file });
        expect(result.success).toBe(true);
      });
    });
  });
});

