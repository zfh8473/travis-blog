import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

/**
 * POST /api/auth/reset-password
 * 
 * Resets user password using a reset token from email.
 * 
 * @param request - HTTP request with token and new password in body
 * @returns Response indicating success or error
 */
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validate input
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Reset token is required",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Password is required",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Password must be at least 8 characters long",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Password must contain at least one letter and one number",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Invalid or expired reset token. Please request a new password reset link.",
            code: "INVALID_TOKEN",
          },
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to reset password. Please try again.",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

