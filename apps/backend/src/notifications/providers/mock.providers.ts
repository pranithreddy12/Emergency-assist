import { Injectable, Logger } from '@nestjs/common';
import {
  CallProvider,
  CallRequest,
  EmailMessage,
  EmailProvider,
  PushMessage,
  PushProvider,
  SendResult,
  SmsMessage,
  SmsProvider,
} from '../notifications.types';

/**
 * Local mock comms providers. They "deliver" by logging, so the whole
 * emergency-notification flow works without FCM/Twilio/SMTP credentials.
 */
@Injectable()
export class MockPushProvider implements PushProvider {
  readonly name = 'mock-push';
  private readonly logger = new Logger(MockPushProvider.name);
  async send(msg: PushMessage): Promise<SendResult> {
    this.logger.log(`[PUSH] ${msg.title} — ${msg.body}`);
    return { provider: this.name, ok: true };
  }
}

@Injectable()
export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock-sms';
  private readonly logger = new Logger(MockSmsProvider.name);
  async send(msg: SmsMessage): Promise<SendResult> {
    this.logger.log(`[SMS -> ${msg.to}] ${msg.body}`);
    return { provider: this.name, ok: true };
  }
  async sendWhatsApp(msg: SmsMessage): Promise<SendResult> {
    this.logger.log(`[WHATSAPP -> ${msg.to}] ${msg.body}`);
    return { provider: this.name, ok: true };
  }
}

@Injectable()
export class MockEmailProvider implements EmailProvider {
  readonly name = 'mock-email';
  private readonly logger = new Logger(MockEmailProvider.name);
  async send(msg: EmailMessage): Promise<SendResult> {
    this.logger.log(`[EMAIL -> ${msg.to}] ${msg.subject}`);
    return { provider: this.name, ok: true };
  }
}

@Injectable()
export class MockCallProvider implements CallProvider {
  readonly name = 'mock-call';
  private readonly logger = new Logger(MockCallProvider.name);
  async place(req: CallRequest): Promise<SendResult> {
    this.logger.log(`[CALL -> ${req.to}] TTS: "${req.message}"`);
    return { provider: this.name, ok: true };
  }
}
