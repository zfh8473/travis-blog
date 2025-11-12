import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registrationSchema } from "@/lib/validations/auth";

/**
 * User registration API endpoint.
 * 
 * Creates a new user account with email and password.
 * Validates input, checks for duplicate emails, hashes password,
 * creates user record, and optionally logs in the user.
 * 
 * @route POST /api/auth/register
 * @param {Request} request - HTTP request with registration data
 * @returns {Promise<NextResponse>} Response with user data or error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'user@example.com',
 *     password: 'password123',
 *     name: 'John Doe'
 *   })
 * });
 * ```
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = registrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid input data",
            code: "VALIDATION_ERROR",
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Email already registered",
            code: "DUPLICATE_EMAIL",
          },
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user record
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          message: "Registration successful",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle database errors
    if (error instanceof Error) {
      // Prisma unique constraint error
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Email already registered",
              code: "DUPLICATE_EMAIL",
            },
          },
          { status: 409 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

