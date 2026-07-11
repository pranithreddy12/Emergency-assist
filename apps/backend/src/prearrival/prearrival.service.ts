import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrearrivalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MAPS_PROVIDER, MapsProvider } from '../maps/maps.types';
import { NotificationsService } from '../notifications/notifications.service';
import { EmergencyGateway } from '../emergency/emergency.gateway';
import { AcknowledgePrearrivalDto } from './dto/prearrival.dto';

@Injectable()
export class PrearrivalService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAPS_PROVIDER) private readonly maps: MapsProvider,
    private readonly notifications: NotificationsService,
    private readonly gateway: EmergencyGateway,
  ) {}

  /**
   * Build an immutable clinical hand-off snapshot and send it to a hospital
   * before the patient arrives. Contains only what a receiving team needs —
   * severity, vitals, allergies, meds, blood group, ETA — never a diagnosis.
   */
  async send(userId: string, incidentId: string, hospitalId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { triageReport: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.reporterId !== userId) throw new ForbiddenException('Not your incident');

    const hospital = await this.prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) throw new NotFoundException('Hospital not found');

    const profile = await this.prisma.medicalProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { displayName: true } },
        emergencyContacts: { orderBy: { priority: 'asc' }, take: 1 },
      },
    });

    // ETA from the incident location to the hospital, if we have coordinates.
    let etaSeconds: number | undefined;
    if (incident.latitude != null && incident.longitude != null) {
      const [est] = await this.maps.travelEstimates(
        { latitude: incident.latitude, longitude: incident.longitude },
        [{ latitude: hospital.latitude, longitude: hospital.longitude }],
      );
      etaSeconds = est?.durationSeconds;
    }

    const report = incident.triageReport;
    const payload = {
      patient: {
        name: profile?.user.displayName ?? 'Unknown',
        bloodGroup: profile?.bloodGroup ?? 'UNKNOWN',
        allergies: profile?.allergies ?? [],
        medications: profile?.medications ?? [],
        chronicConditions: profile?.chronicConditions ?? [],
        isPregnant: profile?.isPregnant ?? false,
      },
      assessment: report
        ? {
            severity: report.severity,
            confidence: report.confidence,
            chiefComplaint: report.chiefComplaint,
            isConscious: report.isConscious,
            isBreathing: report.isBreathing,
            hasBleeding: report.hasBleeding,
            symptoms: report.symptoms,
          }
        : { severity: incident.severity, chiefComplaint: incident.chiefComplaint },
      location:
        incident.latitude != null
          ? { latitude: incident.latitude, longitude: incident.longitude, address: incident.address }
          : null,
      emergencyContact: profile?.emergencyContacts[0]
        ? { name: profile.emergencyContacts[0].name, phone: profile.emergencyContacts[0].phone }
        : null,
      disclaimer:
        'AI-assisted triage summary. Not a diagnosis. For clinical hand-off support only.',
    };

    const prearrival = await this.prisma.hospitalPrearrival.create({
      data: {
        incidentId,
        hospitalId,
        etaSeconds,
        status: PrearrivalStatus.SENT,
        payload: payload as Prisma.InputJsonValue,
      },
      include: { hospital: { select: { name: true } } },
    });

    // Notify the hospital (push with SMS fallback to the hospital phone).
    await this.notifications.pushWithFallback(
      {
        title: `Incoming patient — ${payload.assessment.severity ?? 'unknown'} severity`,
        body: `ETA ${etaSeconds ? Math.round(etaSeconds / 60) + ' min' : 'unknown'}. ${payload.assessment.chiefComplaint ?? ''}`,
        smsTo: hospital.phone ?? undefined,
      },
      { userId, incidentId, template: 'prearrival' },
    );

    this.gateway.emitIncidentEvent(incidentId, 'prearrival:sent', {
      prearrivalId: prearrival.id,
      hospital: prearrival.hospital.name,
      etaSeconds,
    });

    return prearrival;
  }

  async get(id: string) {
    const p = await this.prisma.hospitalPrearrival.findUnique({
      where: { id },
      include: { hospital: { select: { name: true, phone: true } } },
    });
    if (!p) throw new NotFoundException('Pre-arrival not found');
    return p;
  }

  /** Hospital-side inbox. */
  async listForHospital(hospitalId: string) {
    return this.prisma.hospitalPrearrival.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Hospital staff acknowledges (or declines) an incoming patient. */
  async acknowledge(id: string, dto: AcknowledgePrearrivalDto) {
    const existing = await this.prisma.hospitalPrearrival.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pre-arrival not found');

    const updated = await this.prisma.hospitalPrearrival.update({
      where: { id },
      data: {
        status: dto.decline ? PrearrivalStatus.DECLINED : PrearrivalStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        ackNote: dto.note,
      },
    });

    this.gateway.emitIncidentEvent(existing.incidentId, 'prearrival:acknowledged', {
      prearrivalId: id,
      status: updated.status,
      note: dto.note,
    });
    return updated;
  }
}
