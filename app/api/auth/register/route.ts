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
  // Parse request body once and store for reuse
  let body: unknown;
  let validationResult: ReturnType<typeof registrationSchema.safeParse> | undefined;

  try {
    // Parse request body
    body = await request.json();

    // Validate input
    validationResult = registrationSchema.safeParse(body);

    if (!validationResult.success) {
      // Convert Zod error messages to Chinese-friendly format
      const errorDetails = validationResult.error.issues.map((issue) => ({
        ...issue,
        message: issue.message, // Keep original message (already in Chinese from schema)
      }));

      return NextResponse.json(
        {
          success: false,
          error: {
            message: "输入数据无效",
            code: "VALIDATION_ERROR",
            details: errorDetails,
          },
        },
        { status: 400 }
      );
    }

    const { email, password, name, confirmPassword } = validationResult.data;
    
    // Note: confirmPassword is validated by schema but not used in user creation
    // It's only used to ensure password match

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
    // Enhanced error logging with context (without sensitive data)
    const errorContext: {
      error: string;
      errorType: string;
      timestamp: string;
      email?: string;
    } = {
      error: error instanceof Error ? error.message : "Unknown error",
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      timestamp: new Date().toISOString(),
    };

    // Include email if validation was successful (body already parsed)
    if (validationResult && validationResult.success) {
      errorContext.email = validationResult.data.email;
    }

    console.error("Registration error:", errorContext, error);

    // Handle database errors
    if (error instanceof Error) {
      // Prisma unique constraint error
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "该邮箱已被注册",
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
          message: "服务器内部错误",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

