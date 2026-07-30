import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { haversineKm, round } from '../common/geo/geo.util';
import { Public } from '../common/decorators/public.decorator';

/**
 * Nearest public-access defibrillators. Public (no auth) — an AED location is
 * safety info a bystander needs instantly, same as the guidance content.
 */
@ApiTags('aed')
@Controller('aed')
export class AedController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Nearest AEDs to a location (straight-line distance)' })
  async nearby(
    @Query('latitude') lat: string,
    @Query('longitude') lng: string,
    @Query('limit') limit = '5',
  ) {
    const origin = { latitude: Number(lat), longitude: Number(lng) };
    // ponytail: full scan + in-app sort. Fine for a demo-sized registry; add a
    // PostGIS/geohash bound if the AED table ever grows past a few thousand.
    const all = await this.prisma.aed.findMany();
    const aeds = all
      .map((a) => ({ ...a, distanceKm: round(haversineKm(origin, a)) }))
      .sort((x, y) => x.distanceKm - y.distanceKm)
      .slice(0, Math.min(Number(limit) || 5, 20));
    return { count: aeds.length, aeds };
  }
}
