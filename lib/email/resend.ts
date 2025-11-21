import { Resend } from 'resend';

/**
 * Resend email client instance.
 * 
 * Initializes Resend with API key from environment variables.
 * Returns null if RESEND_API_KEY is not set (for build-time compatibility).
 * 
 * @example
 * ```typescript
 * import { getResend } from '@/lib/email/resend';
 * 
 * const resend = getResend();
 * if (resend) {
 *   await resend.emails.send({
 *     from: 'noreply@example.com',
 *     to: 'user@example.com',
 *     subject: 'Hello',
 *     html: '<p>Hello world</p>',
 *   });
 * }
 * ```
 */

/**
 * Gets Resend client instance.
 * Returns null if RESEND_API_KEY is not configured.
 * 
 * @returns Resend client instance or null
 */
export function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Resend client instance (for backward compatibility).
 * Use getResend() instead for better error handling.
 * 
 * @deprecated Use getResend() instead
 */
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

