import type { Logger } from 'pino';
import type { EmailMessage, EmailSender } from './email-sender.js';

/**
 * Sends transactional emails through Resend (https://resend.com).
 * Uses the native fetch API available in Node 18+ so no extra dependency is
 * required. The RESEND_API_KEY and EMAIL_FROM must be provided via env vars.
 *
 * Replace this implementation with a real provider (Resend/SendGrid/etc.) —
 * the interface (EmailSender) keeps call sites provider-agnostic.
 */
export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly logger: Logger,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend email send failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as { id?: string };
    this.logger.info(
      { email: { to: message.to, subject: message.subject, resendId: data?.id ?? null } },
      'email sent via Resend',
    );
  }
}
