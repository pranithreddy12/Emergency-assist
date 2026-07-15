import { Global, Module } from '@nestjs/common';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { STORAGE_PROVIDER } from './storage.types';

/**
 * Global storage. STORAGE_PROVIDER=mock|s3 (default local disk). The S3 provider
 * falls back to local disk when AWS creds are absent.
 */
@Global()
@Module({
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [LocalStorageProvider, S3StorageProvider],
      useFactory: (local: LocalStorageProvider, s3: S3StorageProvider) =>
        (process.env.STORAGE_PROVIDER ?? 'mock') === 's3' ? s3 : local,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
