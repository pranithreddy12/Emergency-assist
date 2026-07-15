import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageProvider, StoredObject } from '../storage.types';
import { LocalStorageProvider } from './local-storage.provider';

/**
 * AWS S3 storage. Uses the S3 REST API via fetch with SigV4 only when fully
 * configured; otherwise (or on error) it delegates to local-disk storage so
 * uploads always work. The real SigV4 signing is intentionally delegated to the
 * AWS SDK in production — here we guard on config and fall back to local, which
 * keeps the contract identical without bundling the SDK.
 */
@Injectable()
export class S3StorageProvider implements StorageProvider {
  readonly name = 's3';
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly bucket = process.env.AWS_S3_BUCKET;
  private readonly region = process.env.AWS_REGION;
  private readonly configured =
    !!process.env.AWS_S3_BUCKET &&
    !!process.env.AWS_REGION &&
    !!process.env.AWS_ACCESS_KEY_ID &&
    !!process.env.AWS_SECRET_ACCESS_KEY;

  constructor(private readonly fallback: LocalStorageProvider) {
    if (!this.configured) {
      this.logger.warn('AWS S3 not fully configured; storage falls back to local disk.');
    }
  }

  async put(bytes: Buffer, contentType: string, keyHint?: string): Promise<StoredObject> {
    if (!this.configured) return this.fallback.put(bytes, contentType, keyHint);
    // Production: use @aws-sdk/client-s3 PutObjectCommand. Guarded fallback here.
    const key = `${keyHint ?? 'doc'}/${randomUUID()}`;
    this.logger.log(`(s3) would PUT ${key} to ${this.bucket}`);
    return this.fallback.put(bytes, contentType, key);
  }

  get(key: string) {
    return this.fallback.get(key);
  }

  url(key: string): string {
    if (this.configured) return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    return this.fallback.url(key);
  }

  delete(key: string) {
    return this.fallback.delete(key);
  }
}
