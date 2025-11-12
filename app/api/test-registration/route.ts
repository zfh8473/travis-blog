import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import { registrationSchema, loginSchema } from "@/lib/validations/auth";

/**
 * Test registration functionality API endpoint.
 * 
 * This endpoint tests registration-related functionality:
 * - Password hashing and comparison
 * - Validation schemas
 * - Database operations (without actually creating users)
 * 
 * @route GET /api/test-registration
 * @returns {Promise<NextResponse>} Response with test results
 * 
 * @example
 * ```typescript
 * // Test registration functionality
 * const response = await fetch('/api/test-registration');
 * const data = await response.json();
 * ```
 */
export async function GET() {
  const results: {
    test: string;
    passed: boolean;
    message?: string;
  }[] = [];

  try {
    // Test 1: Password hashing
    try {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Hashes should be different (due to salt)
      if (hash1 === hash2) {
        results.push({
          test: "Password hashing - unique salts",
          passed: false,
          message: "Hashes should be different due to salt",
        });
      } else {
        results.push({
          test: "Password hashing - unique salts",
          passed: true,
        });
      }

      // Test 2: Password comparison
      const isValid = await comparePassword(password, hash1);
      if (isValid) {
        results.push({
          test: "Password comparison - correct password",
          passed: true,
        });
      } else {
        results.push({
          test: "Password comparison - correct password",
          passed: false,
          message: "Password comparison failed for correct password",
        });
      }

      // Test 3: Password comparison - wrong password
      const isInvalid = await comparePassword("wrongPassword", hash1);
      if (!isInvalid) {
        results.push({
          test: "Password comparison - wrong password",
          passed: true,
        });
      } else {
        results.push({
          test: "Password comparison - wrong password",
          passed: false,
          message: "Password comparison should fail for wrong password",
        });
      }
    } catch (error) {
      results.push({
        test: "Password hashing utilities",
        passed: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 4: Registration schema validation - valid input
    try {
      const validInput = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };
      const result = registrationSchema.safeParse(validInput);
      if (result.success) {
        results.push({
          test: "Registration schema - valid input",
          passed: true,
        });
      } else {
        results.push({
          test: "Registration schema - valid input",
          passed: false,
          message: "Valid input should pass validation",
        });
      }
    } catch (error) {
      results.push({
        test: "Registration schema - valid input",
        passed: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 5: Registration schema validation - invalid email
    try {
      const invalidEmail = {
        email: "invalid-email",
        password: "password123",
      };
      const result = registrationSchema.safeParse(invalidEmail);
      if (!result.success) {
        results.push({
          test: "Registration schema - invalid email",
          passed: true,
        });
      } else {
        results.push({
          test: "Registration schema - invalid email",
          passed: false,
          message: "Invalid email should fail validation",
        });
      }
    } catch (error) {
      results.push({
        test: "Registration schema - invalid email",
        passed: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 6: Registration schema validation - weak password
    try {
      const weakPassword = {
        email: "test@example.com",
        password: "1234567", // Less than 8 characters
      };
      const result = registrationSchema.safeParse(weakPassword);
      if (!result.success) {
        results.push({
          test: "Registration schema - weak password",
          passed: true,
        });
      } else {
        results.push({
          test: "Registration schema - weak password",
          passed: false,
          message: "Weak password should fail validation",
        });
      }
    } catch (error) {
      results.push({
        test: "Registration schema - weak password",
        passed: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 7: Login schema validation
    try {
      const validLogin = {
        email: "test@example.com",
        password: "password123",
      };
      const result = loginSchema.safeParse(validLogin);
      if (result.success) {
        results.push({
          test: "Login schema - valid input",
          passed: true,
        });
      } else {
        results.push({
          test: "Login schema - valid input",
          passed: false,
          message: "Valid login input should pass validation",
        });
      }
    } catch (error) {
      results.push({
        test: "Login schema - valid input",
        passed: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 8: Database connection (check if we can query users table)
    try {
      const userCount = await prisma.user.count();
      results.push({
        test: "Database connection - user table accessible",
        passed: true,
        message: `User table accessible (${userCount} users found)`,
      });
    } catch (error) {
      results.push({
        test: "Database connection - user table accessible",
        passed: false,
        message: error instanceof Error ? error.message : "Database connection failed",
      });
    }

    // Calculate summary
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    const allPassed = passedCount === totalCount;

    return NextResponse.json(
      {
        success: allPassed,
        message: allPassed
          ? "All registration tests passed!"
          : `${passedCount}/${totalCount} tests passed`,
        data: {
          results,
          summary: {
            total: totalCount,
            passed: passedCount,
            failed: totalCount - passedCount,
          },
          timestamp: new Date().toISOString(),
        },
      },
      { status: allPassed ? 200 : 500 }
    );
  } catch (error) {
    console.error("Test registration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown test error",
          code: "TEST_ERROR",
        },
        data: {
          results,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

