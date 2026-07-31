import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { haversineKm, round } from '../common/geo/geo.util';
import { nearbyPlaces } from '../places/overpass';
import { Public } from '../common/decorators/public.decorator';

/**
 * Nearest public-access defibrillators to the CALLER's real location — pulled
 * live from OpenStreetMap worldwide (no seeded city). Public (no auth), same as
 * the guidance content. Falls back to any locally-registered AEDs only if the
 * live lookup fails (e.g. no network).
 */
@ApiTags('aed')
@Controller('aed')
export class AedController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Nearest AEDs to a location (live from OpenStreetMap)' })
  async nearby(
    @Query('latitude') lat: string,
    @Query('longitude') lng: string,
    @Query('limit') limit = '5',
  ) {
    const origin = { latitude: Number(lat), longitude: Number(lng) };
    const n = Math.min(Number(limit) || 5, 20);

    const live = await nearbyPlaces('defibrillator', origin, 5000, n);
    if (live.length > 0) return { source: 'osm', count: live.length, aeds: live };

    // Live lookup failed/empty → only locally-registered AEDs that are ACTUALLY
    // near (<25 km). Never return a far-away AED just to have something — that's
    // the hardcoded-city bug. An empty result is correct here.
    const seeded = (await this.prisma.aed.findMany())
      .map((a) => ({ ...a, distanceKm: round(haversineKm(origin, a)) }))
      .filter((a) => a.distanceKm <= 25)
      .sort((x, y) => x.distanceKm - y.distanceKm)
      .slice(0, n);
    return { source: 'local', count: seeded.length, aeds: seeded };
  }
}
