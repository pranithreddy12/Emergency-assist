export interface SendResult {
  provider: string;
  ok: boolean;
  error?: string;
}

export interface PushMessage {
  token?: string; // device token (optional in mock)
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SmsMessage {
  to: string; // E.164
  body: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface CallRequest {
  to: string;
  message: string; // text-to-speech script
}

export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');
export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
export const CALL_PROVIDER = Symbol('CALL_PROVIDER');

export interface PushProvider {
  readonly name: string;
  send(msg: PushMessage): Promise<SendResult>;
}
export interface SmsProvider {
  readonly name: string;
  send(msg: SmsMessage): Promise<SendResult>;
  sendWhatsApp(msg: SmsMessage): Promise<SendResult>;
}
export interface EmailProvider {
  readonly name: string;
  send(msg: EmailMessage): Promise<SendResult>;
}
export interface CallProvider {
  readonly name: string;
  place(req: CallRequest): Promise<SendResult>;
}
