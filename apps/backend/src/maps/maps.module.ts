import { Global, Module } from '@nestjs/common';
import { MockMapsProvider } from './providers/mock-maps.provider';
import { GoogleMapsProvider } from './providers/google-maps.provider';
import { MAPS_PROVIDER } from './maps.types';

/**
 * Global maps provider. MAPS_PROVIDER=mock|google (default mock). The Google
 * provider itself falls back to mock on any failure.
 */
@Global()
@Module({
  providers: [
    MockMapsProvider,
    GoogleMapsProvider,
    {
      provide: MAPS_PROVIDER,
      inject: [MockMapsProvider, GoogleMapsProvider],
      useFactory: (mock: MockMapsProvider, google: GoogleMapsProvider) =>
        (process.env.MAPS_PROVIDER ?? 'mock') === 'google' ? google : mock,
    },
  ],
  exports: [MAPS_PROVIDER],
})
export class MapsModule {}
