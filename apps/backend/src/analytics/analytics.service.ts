import { Injectable } from '@nestjs/common';
import { Severity, IncidentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { round } from '../common/geo/geo.util';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** System-wide operational overview. */
  async overview() {
    const [total, bySeverity, byStatus, ambulances, prearrivals, acked] = await Promise.all([
      this.prisma.incident.count(),
      this.prisma.incident.groupBy({ by: ['severity'], _count: true }),
      this.prisma.incident.groupBy({ by: ['status'], _count: true }),
      this.prisma.ambulanceRequest.count(),
      this.prisma.hospitalPrearrival.count(),
      this.prisma.hospitalPrearrival.count({ where: { status: 'ACKNOWLEDGED' } }),
    ]);

    const severityCounts: Record<string, number> = {};
    for (const s of Object.values(Severity)) severityCounts[s] = 0;
    bySeverity.forEach((g) => {
      if (g.severity) severityCounts[g.severity] = g._count;
    });

    const statusCounts: Record<string, number> = {};
    for (const s of Object.values(IncidentStatus)) statusCounts[s] = 0;
    byStatus.forEach((g) => (statusCounts[g.status] = g._count));

    return {
      totalIncidents: total,
      activeIncidents: statusCounts[IncidentStatus.ACTIVE] ?? 0,
      resolvedIncidents: statusCounts[IncidentStatus.RESOLVED] ?? 0,
      incidentsBySeverity: severityCounts,
      incidentsByStatus: statusCounts,
      ambulanceRequests: ambulances,
      hospitalPrearrivals: prearrivals,
      prearrivalAckRate: prearrivals ? round(acked / prearrivals, 2) : 0,
    };
  }

  /**
   * Response-time metrics. Dispatch latency = time from incident creation to
   * the ambulance request being created; also reports mean ambulance ETA.
   */
  async responseTimes() {
    const requests = await this.prisma.ambulanceRequest.findMany({
      where: { incidentId: { not: null } },
      include: { incident: { select: { createdAt: true } } },
    });

    const dispatchLatencies: number[] = [];
    const etas: number[] = [];
    for (const r of requests) {
      if (r.incident) {
        dispatchLatencies.push((r.createdAt.getTime() - r.incident.createdAt.getTime()) / 1000);
      }
      if (r.etaSeconds != null) etas.push(r.etaSeconds);
    }

    return {
      sampleSize: requests.length,
      dispatchLatencySeconds: this.stats(dispatchLatencies),
      ambulanceEtaSeconds: this.stats(etas),
    };
  }

  /**
   * Location heatmap: incidents bucketed into a ~1km grid (2-decimal lat/lng).
   */
  async heatmap() {
    const incidents = await this.prisma.incident.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: { latitude: true, longitude: true, severity: true },
    });

    const buckets = new Map<string, { latitude: number; longitude: number; count: number }>();
    for (const inc of incidents) {
      const lat = round(inc.latitude!, 2);
      const lng = round(inc.longitude!, 2);
      const key = `${lat},${lng}`;
      const b = buckets.get(key) ?? { latitude: lat, longitude: lng, count: 0 };
      b.count += 1;
      buckets.set(key, b);
    }
    return { points: [...buckets.values()].sort((a, b) => b.count - a.count) };
  }

  /** Incident counts per day for the last `days` days. */
  async trends(days = 14) {
    const since = new Date(Date.now() - days * 86_400_000);
    const incidents = await this.prisma.incident.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const byDay: Record<string, number> = {};
    for (const inc of incidents) {
      const day = inc.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }
    return {
      days,
      series: Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  private stats(values: number[]) {
    if (values.length === 0) return { count: 0, mean: 0, min: 0, max: 0, median: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((s, v) => s + v, 0);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    return {
      count: sorted.length,
      mean: round(sum / sorted.length),
      min: round(sorted[0]),
      max: round(sorted[sorted.length - 1]),
      median: round(median),
    };
  }
}
