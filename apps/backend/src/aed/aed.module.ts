import { Module } from '@nestjs/common';
import { AedController } from './aed.controller';
import { PlacesController } from '../places/places.controller';

// AEDs + general nearby-places, both live from OpenStreetMap.
@Module({ controllers: [AedController, PlacesController] })
export class AedModule {}
