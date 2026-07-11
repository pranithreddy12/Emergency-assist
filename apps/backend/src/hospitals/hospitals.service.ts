import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Hospital } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { haversineKm, round } from '../common/geo/geo.util';
import { MAPS_PROVIDER, MapsProvider } from '../maps/maps.types';
import { SearchHospitalsDto, HospitalSort } from './dto/hospital.dto';

export interface HospitalResult extends Hospital {
  distanceKm: number;
  travelTimeSeconds: number;
}

@Injectable()
export class HospitalsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAPS_PROVIDER) private readonly maps: MapsProvider,
  ) {}

  async search(dto: SearchHospitalsDto): Promise<{ count: number; hospitals: HospitalResult[] }> {
    const origin = { latitude: dto.latitude, longitude: dto.longitude };
    const radius = dto.radiusKm ?? 25;
    const limit = dto.limit ?? 10;

    // DB-level capability + open filter; distance is computed in-app (portable
    // across DBs without PostGIS).
    const candidates = await this.prisma.hospital.findMany({
      where: {
        ...(dto.capability ? { capabilities: { has: dto.capability } } : {}),
        ...(dto.openNow ? { OR: [{ isOpen24h: true }, { hasEmergency: true }] } : {}),
      },
    });

    // Straight-line filter by radius first (cheap), then enrich the survivors.
    const within = candidates
      .map((h) => ({ h, distanceKm: round(haversineKm(origin, h)) }))
      .filter((c) => c.distanceKm <= radius);

    if (within.length === 0) return { count: 0, hospitals: [] };

    const estimates = await this.maps.travelEstimates(
      origin,
      within.map((c) => ({ latitude: c.h.latitude, longitude: c.h.longitude })),
    );

    let results: HospitalResult[] = within.map((c, i) => ({
      ...c.h,
      distanceKm: c.distanceKm,
      travelTimeSeconds: estimates[i]?.durationSeconds ?? 0,
    }));

    results = this.sort(results, dto.sort ?? HospitalSort.DISTANCE).slice(0, limit);
    return { count: results.length, hospitals: results };
  }

  async getById(id: string): Promise<Hospital> {
    const hospital = await this.prisma.hospital.findUnique({ where: { id } });
    if (!hospital) throw new NotFoundException('Hospital not found');
    return hospital;
  }

  private sort(list: HospitalResult[], by: HospitalSort): HospitalResult[] {
    switch (by) {
      case HospitalSort.RATING:
        return [...list].sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm);
      case HospitalSort.TRAVEL_TIME:
        return [...list].sort((a, b) => a.travelTimeSeconds - b.travelTimeSeconds);
      case HospitalSort.DISTANCE:
      default:
        return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
    }
  }
}
