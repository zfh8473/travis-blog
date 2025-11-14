import { loginSchema } from "@/lib/validations/auth";

/**
 * Unit tests for login validation schema.
 * 
 * Tests the loginSchema Zod validation to ensure it correctly validates
 * email and password inputs according to RFC 5322 email format requirements.
 */
describe("Login Validation Schema", () => {
  describe("Valid inputs", () => {
    it("should validate correct email and password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.password).toBe("password123");
      }
    });

    it("should validate email with subdomain", () => {
      const result = loginSchema.safeParse({
        email: "user@mail.example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("should validate email with plus sign", () => {
      const result = loginSchema.safeParse({
        email: "user+tag@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Invalid email formats", () => {
    it("should reject missing email", () => {
      const result = loginSchema.safeParse({
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("should reject empty email", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject email without domain", () => {
      const result = loginSchema.safeParse({
        email: "user@",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject email without @ symbol", () => {
      const result = loginSchema.safeParse({
        email: "userexample.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Invalid password", () => {
    it("should reject missing password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Both fields invalid", () => {
    it("should reject when both email and password are invalid", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });
  });
});

