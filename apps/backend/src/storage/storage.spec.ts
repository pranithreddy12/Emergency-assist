import { promises as fs } from 'fs';
import { resolve } from 'path';
import { LocalStorageProvider } from './providers/local-storage.provider';

describe('LocalStorageProvider', () => {
  const dir = resolve('.uploads-test');
  let provider: LocalStorageProvider;

  beforeAll(() => {
    process.env.LOCAL_STORAGE_DIR = dir;
    provider = new LocalStorageProvider();
  });

  afterAll(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('stores and retrieves bytes with content type', async () => {
    const data = Buffer.from('hello emergency');
    const stored = await provider.put(data, 'text/plain', 'user1');
    expect(stored.key).toContain('user1');
    expect(stored.sizeBytes).toBe(data.length);

    const got = await provider.get(stored.key);
    expect(got).not.toBeNull();
    expect(got!.bytes.toString()).toBe('hello emergency');
    expect(got!.contentType).toBe('text/plain');
  });

  it('returns null for a missing key', async () => {
    expect(await provider.get('does-not-exist')).toBeNull();
  });

  it('deletes an object', async () => {
    const stored = await provider.put(Buffer.from('x'), 'text/plain');
    await provider.delete(stored.key);
    expect(await provider.get(stored.key)).toBeNull();
  });

  it('produces a download URL for a key', () => {
    expect(provider.url('abc')).toContain('/documents/raw/abc');
  });
});
