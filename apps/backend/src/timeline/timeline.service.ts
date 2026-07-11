import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TimelineEntry {
  type: 'INCIDENT' | 'AMBULANCE' | 'PREARRIVAL' | 'DOCUMENT';
  id: string;
  at: Date;
  title: string;
  subtitle?: string;
  severity?: string | null;
  status?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Unified, reverse-chronological medical timeline for a user: past
   * emergencies, ambulance requests, hospital pre-arrivals and documents.
   */
  async forUser(userId: string): Promise<{ count: number; entries: TimelineEntry[] }> {
    const [incidents, ambulances, profile] = await Promise.all([
      this.prisma.incident.findMany({
        where: { reporterId: userId },
        include: {
          triageReport: { select: { severity: true, confidence: true } },
          prearrivals: { include: { hospital: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ambulanceRequest.findMany({
        where: { userId },
        include: { ambulance: { select: { vehicleNumber: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.medicalProfile.findUnique({
        where: { userId },
        include: { documents: true },
      }),
    ]);

    const entries: TimelineEntry[] = [];

    for (const inc of incidents) {
      entries.push({
        type: 'INCIDENT',
        id: inc.id,
        at: inc.createdAt,
        title: inc.chiefComplaint ?? 'Emergency incident',
        subtitle: inc.address ?? undefined,
        severity: inc.severity,
        status: inc.status,
        meta: {
          confidence: inc.triageReport?.confidence,
          hospitalsNotified: inc.prearrivals.map((p) => p.hospital.name),
        },
      });
    }

    for (const amb of ambulances) {
      entries.push({
        type: 'AMBULANCE',
        id: amb.id,
        at: amb.createdAt,
        title: 'Ambulance request',
        subtitle: amb.ambulance?.vehicleNumber
          ? `Unit ${amb.ambulance.vehicleNumber}`
          : undefined,
        status: amb.status,
      });
    }

    for (const doc of profile?.documents ?? []) {
      entries.push({
        type: 'DOCUMENT',
        id: doc.id,
        at: doc.createdAt,
        title: doc.label,
        subtitle: doc.contentType,
      });
    }

    entries.sort((a, b) => b.at.getTime() - a.at.getTime());
    return { count: entries.length, entries };
  }

  /** Per-user summary counts for the profile/timeline header. */
  async summary(userId: string) {
    const [incidents, resolved, ambulances, prearrivals] = await Promise.all([
      this.prisma.incident.count({ where: { reporterId: userId } }),
      this.prisma.incident.count({ where: { reporterId: userId, status: 'RESOLVED' } }),
      this.prisma.ambulanceRequest.count({ where: { userId } }),
      this.prisma.hospitalPrearrival.count({ where: { incident: { reporterId: userId } } }),
    ]);
    return {
      totalIncidents: incidents,
      resolvedIncidents: resolved,
      ambulanceRequests: ambulances,
      hospitalPrearrivals: prearrivals,
    };
  }
}
