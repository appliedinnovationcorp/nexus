// Email Service Adapters

import { EmailService } from '@nexus/application-core';

export class ConsoleEmailService implements EmailService {
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    console.log(`📧 Welcome Email sent to ${email} (${name})`);
    console.log(`Subject: Welcome to Nexus!`);
    console.log(`Body: Hello ${name}, welcome to our platform!`);
  }

  async sendNotification(email: string, subject: string, body: string): Promise<void> {
    console.log(`📧 Notification sent to ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
  }
}

export class SendGridEmailService implements EmailService {
  constructor(private readonly apiKey: string) {}

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // TODO: Implement with actual SendGrid API
    console.log(`SendGrid: Welcome email would be sent to ${email}`);
  }

  async sendNotification(email: string, subject: string, body: string): Promise<void> {
    // TODO: Implement with actual SendGrid API
    console.log(`SendGrid: Notification would be sent to ${email}`);
  }
}

export class SESEmailService implements EmailService {
  constructor(private readonly region: string) {}

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // TODO: Implement with AWS SES
    console.log(`AWS SES: Welcome email would be sent to ${email}`);
  }

  async sendNotification(email: string, subject: string, body: string): Promise<void> {
    // TODO: Implement with AWS SES
    console.log(`AWS SES: Notification would be sent to ${email}`);
  }
}
