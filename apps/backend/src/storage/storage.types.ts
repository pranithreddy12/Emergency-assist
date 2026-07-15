export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StoredObject {
  key: string;
  contentType: string;
  sizeBytes: number;
}

export interface StorageProvider {
  readonly name: string;
  /** Store bytes and return a stable key. */
  put(bytes: Buffer, contentType: string, keyHint?: string): Promise<StoredObject>;
  /** Retrieve bytes for a key (null if missing). */
  get(key: string): Promise<{ bytes: Buffer; contentType: string } | null>;
  /** A URL/handle a client can use to fetch the object. */
  url(key: string): string;
  delete(key: string): Promise<void>;
}
