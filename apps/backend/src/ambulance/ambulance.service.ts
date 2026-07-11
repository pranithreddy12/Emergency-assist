import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  AmbulanceStatus,
  AmbulanceRequestStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MAPS_PROVIDER, MapsProvider } from '../maps/maps.types';
import { haversineKm, round } from '../common/geo/geo.util';
import { EmergencyGateway } from '../emergency/emergency.gateway';
import { BookAmbulanceDto } from './dto/ambulance.dto';

@Injectable()
export class AmbulanceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAPS_PROVIDER) private readonly maps: MapsProvider,
    private readonly gateway: EmergencyGateway,
  ) {}

  /** One-tap booking: assign the nearest available unit and compute ETA. */
  async book(userId: string, dto: BookAmbulanceDto) {
    const pickup = { latitude: dto.pickupLat, longitude: dto.pickupLng };

    const available = await this.prisma.ambulance.findMany({
      where: {
        status: AmbulanceStatus.AVAILABLE,
        ...(dto.type ? { type: dto.type } : {}),
      },
    });
    if (available.length === 0) {
      throw new ServiceUnavailableException('No ambulances available right now');
    }

    // Nearest by straight-line distance.
    const ranked = available
      .map((a) => ({ a, km: haversineKm(pickup, a) }))
      .sort((x, y) => x.km - y.km);

    const [estimate] = await this.maps.travelEstimates(
      { latitude: ranked[0].a.latitude, longitude: ranked[0].a.longitude },
      [pickup],
    );

    // Concurrency guard: only claim the unit if it is still AVAILABLE.
    for (const { a } of ranked) {
      const claimed = await this.prisma.ambulance.updateMany({
        where: { id: a.id, status: AmbulanceStatus.AVAILABLE },
        data: { status: AmbulanceStatus.DISPATCHED },
      });
      if (claimed.count === 1) {
        return this.createRequest(userId, dto, a.id, estimate.distanceKm, estimate.durationSeconds);
      }
    }
    throw new ServiceUnavailableException('Ambulances just became busy — please retry');
  }

  private async createRequest(
    userId: string,
    dto: BookAmbulanceDto,
    ambulanceId: string,
    distanceKm: number,
    etaSeconds: number,
  ) {
    let request;
    try {
      request = await this.prisma.ambulanceRequest.create({
        data: {
          userId,
          ambulanceId,
          incidentId: dto.incidentId,
          destinationHospitalId: dto.destinationHospitalId,
          status: AmbulanceRequestStatus.ASSIGNED,
          pickupLat: dto.pickupLat,
          pickupLng: dto.pickupLng,
          pickupAddress: dto.pickupAddress,
          distanceKm,
          etaSeconds,
        },
        include: { ambulance: true, destinationHospital: true },
      });
    } catch (e) {
      // Roll back the claim if the request could not be created (e.g. bad incidentId).
      await this.prisma.ambulance.update({
        where: { id: ambulanceId },
        data: { status: AmbulanceStatus.AVAILABLE },
      });
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('This incident already has an ambulance request');
      }
      throw e;
    }

    if (dto.incidentId) {
      this.gateway.emitIncidentEvent(dto.incidentId, 'ambulance:assigned', {
        requestId: request.id,
        etaSeconds,
        vehicleNumber: request.ambulance?.vehicleNumber,
      });
    }
    return request;
  }

  /** Live tracking: recompute ETA from the ambulance's current location. */
  async track(userId: string, requestId: string) {
    const request = await this.prisma.ambulanceRequest.findUnique({
      where: { id: requestId },
      include: { ambulance: true, destinationHospital: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.userId !== userId) throw new ForbiddenException('Not your request');

    let etaSeconds = request.etaSeconds;
    const trackable: AmbulanceRequestStatus[] = [
      AmbulanceRequestStatus.ASSIGNED,
      AmbulanceRequestStatus.EN_ROUTE,
    ];
    if (request.ambulance && trackable.includes(request.status)) {
      const [est] = await this.maps.travelEstimates(
        { latitude: request.ambulance.latitude, longitude: request.ambulance.longitude },
        [{ latitude: request.pickupLat, longitude: request.pickupLng }],
      );
      etaSeconds = est.durationSeconds;
    }

    return {
      ...request,
      etaSeconds,
      driver: request.ambulance
        ? {
            name: request.ambulance.driverName,
            phone: request.ambulance.driverPhone,
            vehicleNumber: request.ambulance.vehicleNumber,
            type: request.ambulance.type,
            location: {
              latitude: request.ambulance.latitude,
              longitude: request.ambulance.longitude,
            },
          }
        : null,
    };
  }

  async listMine(userId: string) {
    return this.prisma.ambulanceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { ambulance: { select: { vehicleNumber: true, driverName: true } } },
    });
  }

  async cancel(userId: string, requestId: string) {
    const request = await this.prisma.ambulanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.userId !== userId) throw new ForbiddenException('Not your request');
    const closed: AmbulanceRequestStatus[] = [
      AmbulanceRequestStatus.COMPLETED,
      AmbulanceRequestStatus.CANCELLED,
    ];
    if (closed.includes(request.status)) {
      throw new BadRequestException('Request already closed');
    }

    const updated = await this.prisma.ambulanceRequest.update({
      where: { id: requestId },
      data: { status: AmbulanceRequestStatus.CANCELLED, cancelledAt: new Date() },
    });
    // Free the unit.
    if (request.ambulanceId) {
      await this.prisma.ambulance.update({
        where: { id: request.ambulanceId },
        data: { status: AmbulanceStatus.AVAILABLE },
      });
    }
    if (request.incidentId) {
      this.gateway.emitIncidentEvent(request.incidentId, 'ambulance:cancelled', {
        requestId,
      });
    }
    return updated;
  }

  /** Distance helper exposed for tests/diagnostics. */
  distanceKm = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) =>
    round(haversineKm(a, b));
}
