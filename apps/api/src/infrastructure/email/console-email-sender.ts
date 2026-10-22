import type { Logger } from 'pino';
import type { EmailMessage, EmailSender } from './email-sender.js';

/**
 * Development transport. Phase 3 has no SMTP configuration, so messages are logged
 * and the password-reset token is exposed by the auth service in non-production
 * environments. Replace this with a real provider before production use.
 */
export class ConsoleEmailSender implements EmailSender {
  constructor(private readonly logger: Logger) {}

  send(message: EmailMessage): Promise<void> {
    this.logger.info({ email: { to: message.to, subject: message.subject } }, message.text);
    return Promise.resolve();
  }
}
