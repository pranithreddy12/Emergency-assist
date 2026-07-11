import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  MockPushProvider,
  MockSmsProvider,
  MockEmailProvider,
  MockCallProvider,
} from './providers/mock.providers';
import { FcmPushProvider, TwilioSmsProvider } from './providers/real.providers';
import {
  CALL_PROVIDER,
  EMAIL_PROVIDER,
  PUSH_PROVIDER,
  SMS_PROVIDER,
} from './notifications.types';

/**
 * Global comms layer. Provider selection is env-driven; real providers fall
 * back to their mock on missing keys / failure, so nothing needs credentials.
 *   NOTIFY_PROVIDER=mock|fcm     SMS_PROVIDER=mock|twilio
 */
@Global()
@Module({
  providers: [
    MockPushProvider,
    MockSmsProvider,
    MockEmailProvider,
    MockCallProvider,
    FcmPushProvider,
    TwilioSmsProvider,
    {
      provide: PUSH_PROVIDER,
      inject: [MockPushProvider, FcmPushProvider],
      useFactory: (mock: MockPushProvider, fcm: FcmPushProvider) =>
        (process.env.NOTIFY_PROVIDER ?? 'mock') === 'fcm' ? fcm : mock,
    },
    {
      provide: SMS_PROVIDER,
      inject: [MockSmsProvider, TwilioSmsProvider],
      useFactory: (mock: MockSmsProvider, twilio: TwilioSmsProvider) =>
        (process.env.SMS_PROVIDER ?? 'mock') === 'twilio' ? twilio : mock,
    },
    { provide: EMAIL_PROVIDER, useClass: MockEmailProvider },
    { provide: CALL_PROVIDER, useClass: MockCallProvider },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
