import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * AES-256-GCM field-level encryption for PII/PHI.
 * Ciphertext layout (base64):  iv(12) | authTag(16) | ciphertext
 */
@Injectable()
export class FieldCryptoService {
  private readonly logger = new Logger(FieldCryptoService.name);
  private readonly key: Buffer;

  constructor() {
    const raw = process.env.FIELD_ENCRYPTION_KEY ?? '';
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      this.logger.warn(
        'FIELD_ENCRYPTION_KEY is not a 32-byte base64 key; falling back to an ephemeral dev key. Set a real key in production.',
      );
      this.key = randomBytes(32);
    } else {
      this.key = key;
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  decrypt(payload: string): string {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  }
}
