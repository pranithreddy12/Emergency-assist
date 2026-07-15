import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { StorageProvider, StoredObject } from '../storage.types';

/**
 * Local-disk storage — the default mock. Persists uploads under an on-disk
 * directory so documents survive across requests without S3 credentials.
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly root = resolve(process.env.LOCAL_STORAGE_DIR ?? '.uploads');

  private async ensureRoot() {
    await fs.mkdir(this.root, { recursive: true });
  }

  private metaPath(key: string) {
    return join(this.root, `${key}.meta.json`);
  }
  private dataPath(key: string) {
    return join(this.root, `${key}.bin`);
  }

  async put(bytes: Buffer, contentType: string, keyHint?: string): Promise<StoredObject> {
    await this.ensureRoot();
    const key = `${keyHint ? keyHint.replace(/[^a-zA-Z0-9_-]/g, '') + '-' : ''}${randomUUID()}`;
    await fs.writeFile(this.dataPath(key), bytes);
    await fs.writeFile(this.metaPath(key), JSON.stringify({ contentType, sizeBytes: bytes.length }));
    return { key, contentType, sizeBytes: bytes.length };
  }

  async get(key: string): Promise<{ bytes: Buffer; contentType: string } | null> {
    try {
      const bytes = await fs.readFile(this.dataPath(key));
      const meta = JSON.parse(await fs.readFile(this.metaPath(key), 'utf8'));
      return { bytes, contentType: meta.contentType ?? 'application/octet-stream' };
    } catch {
      return null;
    }
  }

  url(key: string): string {
    const base = process.env.API_PUBLIC_URL ?? 'http://localhost:3000/api/v1';
    return `${base}/documents/raw/${key}`;
  }

  async delete(key: string): Promise<void> {
    await Promise.allSettled([fs.unlink(this.dataPath(key)), fs.unlink(this.metaPath(key))]);
  }
}
