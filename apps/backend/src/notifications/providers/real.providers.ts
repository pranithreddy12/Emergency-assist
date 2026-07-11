import { Injectable, Logger } from '@nestjs/common';
import {
  PushMessage,
  PushProvider,
  SendResult,
  SmsMessage,
  SmsProvider,
} from '../notifications.types';
import { MockPushProvider, MockSmsProvider } from './mock.providers';

/**
 * Firebase Cloud Messaging push provider. Requires FCM credentials; without
 * them it delegates to the mock so nothing breaks. The HTTP v1 call is wired
 * behind an env-guarded path (server key flow shown for brevity).
 */
@Injectable()
export class FcmPushProvider implements PushProvider {
  readonly name = 'fcm';
  private readonly logger = new Logger(FcmPushProvider.name);
  private readonly serverKey = process.env.FCM_SERVER_KEY;

  constructor(private readonly fallback: MockPushProvider) {
    if (!this.serverKey) {
      this.logger.warn('FCM_SERVER_KEY missing; FCM push falls back to mock.');
    }
  }

  async send(msg: PushMessage): Promise<SendResult> {
    if (!this.serverKey || !msg.token) return this.fallback.send(msg);
    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: msg.token,
          notification: { title: msg.title, body: msg.body },
          data: msg.data ?? {},
        }),
      });
      if (!res.ok) return { provider: this.name, ok: false, error: `HTTP ${res.status}` };
      return { provider: this.name, ok: true };
    } catch (err) {
      this.logger.error('FCM send failed; using mock', err as Error);
      return this.fallback.send(msg);
    }
  }
}

/**
 * Twilio SMS/WhatsApp provider. Requires TWILIO_* env vars; otherwise mock.
 */
@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';
  private readonly logger = new Logger(TwilioSmsProvider.name);
  private readonly sid = process.env.TWILIO_ACCOUNT_SID;
  private readonly token = process.env.TWILIO_AUTH_TOKEN;
  private readonly from = process.env.TWILIO_FROM;
  private readonly waFrom = process.env.TWILIO_WHATSAPP_FROM;

  constructor(private readonly fallback: MockSmsProvider) {
    if (!this.sid || !this.token) {
      this.logger.warn('TWILIO_* missing; SMS/WhatsApp fall back to mock.');
    }
  }

  send(msg: SmsMessage): Promise<SendResult> {
    return this.dispatch(this.from, msg.to, msg.body, () => this.fallback.send(msg));
  }

  sendWhatsApp(msg: SmsMessage): Promise<SendResult> {
    return this.dispatch(
      this.waFrom,
      `whatsapp:${msg.to}`,
      msg.body,
      () => this.fallback.sendWhatsApp(msg),
    );
  }

  private async dispatch(
    from: string | undefined,
    to: string,
    body: string,
    fallback: () => Promise<SendResult>,
  ): Promise<SendResult> {
    if (!this.sid || !this.token || !from) return fallback();
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`;
      const form = new URLSearchParams({ From: from, To: to, Body: body });
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.sid}:${this.token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });
      if (!res.ok) return { provider: this.name, ok: false, error: `HTTP ${res.status}` };
      return { provider: this.name, ok: true };
    } catch (err) {
      this.logger.error('Twilio send failed; using mock', err as Error);
      return fallback();
    }
  }
}
