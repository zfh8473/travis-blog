import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

/**
 * POST /api/auth/forgot-password
 * 
 * Sends a password reset email to the user.
 * 
 * For security reasons, this endpoint always returns success even if the email
 * doesn't exist, to prevent email enumeration attacks.
 * 
 * @param request - HTTP request with email in body
 * @returns Response indicating success (always, for security)
 */
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      // Return success even for invalid input (security: prevent enumeration)
      return NextResponse.json({
        success: true,
        message: "If the email exists, a password reset link has been sent.",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // If user doesn't exist, return success anyway (security: prevent enumeration)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If the email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetTokenExpiry,
      },
    });

    // Generate reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    // For now, we'll log it (in production, use a proper email service like Resend)
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
    console.log(`[Password Reset] Reset URL: ${resetUrl}`);

    // In production, send email here:
    // await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({
      success: true,
      message: "If the email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    // Return success even on error (security: prevent enumeration)
    return NextResponse.json({
      success: true,
      message: "If the email exists, a password reset link has been sent.",
    });
  }
}

