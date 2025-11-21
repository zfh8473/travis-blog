import { Resend } from 'resend';

/**
 * Resend email client instance.
 * 
 * Initializes Resend with API key from environment variables.
 * Throws error if RESEND_API_KEY is not set.
 * 
 * @example
 * ```typescript
 * import { resend } from '@/lib/email/resend';
 * 
 * await resend.emails.send({
 *   from: 'noreply@example.com',
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   html: '<p>Hello world</p>',
 * });
 * ```
 */
if (!process.env.RESEND_API_KEY) {
  throw new Error(
    'RESEND_API_KEY environment variable is required. ' +
    'Please set it in your .env.local file or environment variables.'
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY);

