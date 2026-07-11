import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CALL_PROVIDER,
  CallProvider,
  EMAIL_PROVIDER,
  EmailProvider,
  PUSH_PROVIDER,
  PushProvider,
  SMS_PROVIDER,
  SendResult,
  SmsProvider,
} from './notifications.types';

interface LogMeta {
  userId?: string;
  incidentId?: string;
  template: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_PROVIDER) private readonly push: PushProvider,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
    @Inject(CALL_PROVIDER) private readonly call: CallProvider,
  ) {}

  async sms_(to: string, body: string, meta: LogMeta): Promise<SendResult> {
    const r = await this.sms.send({ to, body });
    await this.log(NotificationChannel.SMS, to, r, meta);
    return r;
  }

  async whatsApp(to: string, body: string, meta: LogMeta): Promise<SendResult> {
    const r = await this.sms.sendWhatsApp({ to, body });
    await this.log(NotificationChannel.WHATSAPP, to, r, meta);
    return r;
  }

  async email_(to: string, subject: string, body: string, meta: LogMeta): Promise<SendResult> {
    const r = await this.email.send({ to, subject, body });
    await this.log(NotificationChannel.EMAIL, to, r, meta);
    return r;
  }

  async placeCall(to: string, message: string, meta: LogMeta): Promise<SendResult> {
    const r = await this.call.place({ to, message });
    await this.log(NotificationChannel.CALL, to, r, meta);
    return r;
  }

  /**
   * Push with graceful fallback: if push fails and an SMS number is provided,
   * fall back to SMS, then email. Records every attempt.
   */
  async pushWithFallback(
    args: { title: string; body: string; token?: string; smsTo?: string; emailTo?: string },
    meta: LogMeta,
  ): Promise<SendResult> {
    const pushResult = await this.push.send({ title: args.title, body: args.body, token: args.token });
    await this.log(NotificationChannel.PUSH, args.token ?? 'device', pushResult, meta);
    if (pushResult.ok) return pushResult;

    if (args.smsTo) {
      const sms = await this.sms_(args.smsTo, `${args.title}: ${args.body}`, meta);
      if (sms.ok) return sms;
    }
    if (args.emailTo) {
      return this.email_(args.emailTo, args.title, args.body, meta);
    }
    return pushResult;
  }

  private async log(
    channel: NotificationChannel,
    recipient: string,
    result: SendResult,
    meta: LogMeta,
  ): Promise<void> {
    try {
      await this.prisma.notificationLog.create({
        data: {
          userId: meta.userId,
          incidentId: meta.incidentId,
          channel,
          recipient,
          template: meta.template,
          provider: result.provider,
          status: result.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
          error: result.error,
        },
      });
    } catch (err) {
      this.logger.error('Failed to write notification log', err as Error);
    }
  }
}
