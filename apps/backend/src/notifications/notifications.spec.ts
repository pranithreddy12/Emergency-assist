import { NotificationsService } from './notifications.service';
import {
  CallProvider,
  EmailProvider,
  PushProvider,
  SmsProvider,
} from './notifications.types';

// Minimal fakes so we can assert orchestration without a DB or real providers.
function makeService(pushOk: boolean) {
  const logs: string[] = [];
  const prisma = {
    notificationLog: { create: async () => ({}) },
  } as any;

  const push: PushProvider = {
    name: 'fake-push',
    send: async () => {
      logs.push('push');
      return { provider: 'fake-push', ok: pushOk, error: pushOk ? undefined : 'boom' };
    },
  };
  const sms: SmsProvider = {
    name: 'fake-sms',
    send: async () => {
      logs.push('sms');
      return { provider: 'fake-sms', ok: true };
    },
    sendWhatsApp: async () => {
      logs.push('wa');
      return { provider: 'fake-sms', ok: true };
    },
  };
  const email: EmailProvider = {
    name: 'fake-email',
    send: async () => {
      logs.push('email');
      return { provider: 'fake-email', ok: true };
    },
  };
  const call: CallProvider = {
    name: 'fake-call',
    place: async () => {
      logs.push('call');
      return { provider: 'fake-call', ok: true };
    },
  };

  const service = new NotificationsService(prisma, push, sms, email, call);
  return { service, logs };
}

describe('NotificationsService fallback', () => {
  it('uses push when push succeeds (no fallback)', async () => {
    const { service, logs } = makeService(true);
    const r = await service.pushWithFallback(
      { title: 'A', body: 'B', smsTo: '+1', emailTo: 'x@y.z' },
      { template: 't' },
    );
    expect(r.ok).toBe(true);
    expect(logs).toEqual(['push']);
  });

  it('falls back to SMS when push fails', async () => {
    const { service, logs } = makeService(false);
    const r = await service.pushWithFallback(
      { title: 'A', body: 'B', smsTo: '+1', emailTo: 'x@y.z' },
      { template: 't' },
    );
    expect(r.ok).toBe(true);
    expect(r.provider).toBe('fake-sms');
    expect(logs).toEqual(['push', 'sms']);
  });

  it('falls back to email when push fails and no SMS number', async () => {
    const { service, logs } = makeService(false);
    const r = await service.pushWithFallback(
      { title: 'A', body: 'B', emailTo: 'x@y.z' },
      { template: 't' },
    );
    expect(r.provider).toBe('fake-email');
    expect(logs).toEqual(['push', 'email']);
  });
});
