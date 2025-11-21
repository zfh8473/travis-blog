import { resend } from './resend';
import { PasswordResetEmail } from './templates/password-reset';

/**
 * Parameters for sending password reset email.
 */
interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  userName?: string;
}

/**
 * Sends a password reset email to the user.
 * 
 * Uses Resend to send a password reset email with a reset link.
 * 
 * @param params - Email parameters
 * @param params.to - Recipient email address
 * @param params.resetUrl - Password reset URL with token
 * @param params.userName - Optional user name for personalization
 * @returns Resend email send result
 * @throws Error if email sending fails
 * 
 * @example
 * ```typescript
 * await sendPasswordResetEmail({
 *   to: 'user@example.com',
 *   resetUrl: 'https://example.com/reset-password?token=xxx',
 *   userName: 'John Doe',
 * });
 * ```
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName,
}: SendPasswordResetEmailParams) {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Travis Blog <noreply@travis-blog.vercel.app>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: '重置您的密码 - Travis Blog',
      react: PasswordResetEmail({ resetUrl, userName }),
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log('Password reset email sent successfully:', {
      emailId: data?.id,
      to,
    });

    return data;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    throw error;
  }
}

