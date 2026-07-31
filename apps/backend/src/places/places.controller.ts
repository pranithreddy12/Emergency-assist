import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { nearbyPlaces, PlaceType } from './overpass';
import { Public } from '../common/decorators/public.decorator';

const TYPES: PlaceType[] = ['defibrillator', 'hospital', 'pharmacy'];

/** Real nearby places around the caller — worldwide, from OpenStreetMap. */
@ApiTags('places')
@Controller('places')
export class PlacesController {
  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Nearby AEDs / hospitals / pharmacies (live from OpenStreetMap)' })
  @ApiQuery({ name: 'type', enum: TYPES })
  async nearby(
    @Query('type') type: string,
    @Query('latitude') lat: string,
    @Query('longitude') lng: string,
    @Query('radiusM') radiusM = '4000',
    @Query('limit') limit = '10',
  ) {
    if (!TYPES.includes(type as PlaceType)) {
      throw new BadRequestException(`type must be one of: ${TYPES.join(', ')}`);
    }
    const places = await nearbyPlaces(
      type as PlaceType,
      { latitude: Number(lat), longitude: Number(lng) },
      Math.min(Number(radiusM) || 4000, 20000),
      Math.min(Number(limit) || 10, 30),
    );
    return { type, count: places.length, places };
  }
}
