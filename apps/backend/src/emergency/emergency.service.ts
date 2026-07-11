import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IncidentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TriageService } from '../triage/triage.service';
import { EmergencyGateway } from './emergency.gateway';
import { CreateIncidentDto, UpdateIncidentStatusDto } from './dto/emergency.dto';

// Allowed forward transitions for the incident state machine.
const TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  DRAFT: [IncidentStatus.ACTIVE, IncidentStatus.CANCELLED],
  ACTIVE: [IncidentStatus.DISPATCHED, IncidentStatus.CANCELLED, IncidentStatus.RESOLVED],
  DISPATCHED: [IncidentStatus.EN_ROUTE, IncidentStatus.CANCELLED],
  EN_ROUTE: [IncidentStatus.AT_HOSPITAL, IncidentStatus.CANCELLED],
  AT_HOSPITAL: [IncidentStatus.RESOLVED],
  RESOLVED: [],
  CANCELLED: [],
};

@Injectable()
export class EmergencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly triage: TriageService,
    private readonly gateway: EmergencyGateway,
  ) {}

  /**
   * Raises an SOS: runs triage, persists the incident + immutable report,
   * marks it ACTIVE, and broadcasts to the incident room.
   */
  async createIncident(userId: string, dto: CreateIncidentDto) {
    const result = await this.triage.assess(dto.triage);

    const incident = await this.prisma.incident.create({
      data: {
        reporterId: userId,
        status: IncidentStatus.ACTIVE,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        severity: result.severity,
        chiefComplaint: result.chiefComplaint,
        triageReport: {
          create: {
            severity: result.severity,
            confidence: result.confidence,
            chiefComplaint: result.chiefComplaint,
            isConscious: result.isConscious,
            isBreathing: result.isBreathing,
            hasBleeding: result.hasBleeding,
            patientAge: result.patientAge,
            symptoms: result.symptoms,
            recommendedActions: result.recommendedActions,
            suggestedFacility: result.suggestedFacility,
            disclaimer: result.disclaimer,
            engineVersion: result.engineVersion,
            provider: result.provider,
            rawModel: (result.rawModel ?? undefined) as Prisma.InputJsonValue,
          },
        },
        events: {
          create: {
            type: 'STATUS_CHANGE',
            payload: { to: IncidentStatus.ACTIVE, reason: 'SOS raised' },
          },
        },
      },
      include: { triageReport: true },
    });

    this.gateway.emitIncidentEvent(incident.id, 'incident:created', incident);
    return incident;
  }

  async getIncident(userId: string, id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { triageReport: true, events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.reporterId !== userId) throw new ForbiddenException('Not your incident');
    return incident;
  }

  async listIncidents(userId: string) {
    return this.prisma.incident.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      include: { triageReport: { select: { severity: true, confidence: true } } },
    });
  }

  async updateStatus(userId: string, id: string, dto: UpdateIncidentStatusDto) {
    const incident = await this.getIncident(userId, id);
    const allowed = TRANSITIONS[incident.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot move from ${incident.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        status: dto.status,
        events: {
          create: { type: 'STATUS_CHANGE', payload: { to: dto.status, note: dto.note } },
        },
      },
      include: { triageReport: true, events: { orderBy: { createdAt: 'asc' } } },
    });

    this.gateway.emitIncidentEvent(id, 'incident:status', {
      incidentId: id,
      status: dto.status,
    });
    return updated;
  }
}
