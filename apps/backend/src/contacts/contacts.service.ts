import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private trackingBase(): string {
    return process.env.PUBLIC_TRACKING_BASE_URL ?? 'http://localhost:3000/api/v1/track';
  }

  /**
   * Alert the reporter's emergency contacts about an active incident. Ensures a
   * public tracking token, then messages each contact per their preferences
   * (SMS + WhatsApp, and a voice call for priority-1 contacts).
   */
  async alertContacts(userId: string, incidentId: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.reporterId !== userId) throw new ForbiddenException('Not your incident');

    const profile = await this.prisma.medicalProfile.findUnique({
      where: { userId },
      include: { emergencyContacts: { orderBy: { priority: 'asc' } }, user: true },
    });
    const contacts = profile?.emergencyContacts ?? [];
    if (contacts.length === 0) {
      throw new BadRequestException('No emergency contacts configured');
    }

    const token = await this.ensureTrackingToken(incidentId, incident.trackingToken);
    const link = `${this.trackingBase()}/${token}`;
    const name = profile?.user.displayName ?? 'Someone';
    const sev = incident.severity ? `${incident.severity} severity` : 'an emergency';

    const smsBody = `EmergencyAI alert: ${name} may need help (${sev}). Live location: ${link}`;
    const callScript = `This is an automated EmergencyAI alert. ${name} has triggered an emergency and may need your help. Please check your messages for a live tracking link.`;

    const results = [];
    for (const c of contacts) {
      const meta = { userId, incidentId, template: 'contact-alert' };
      const perContact: Record<string, unknown> = { contact: c.name, phone: c.phone };
      if (c.notifyBySms) {
        perContact.sms = (await this.notifications.sms_(c.phone, smsBody, meta)).ok;
        perContact.whatsApp = (await this.notifications.whatsApp(c.phone, smsBody, meta)).ok;
      }
      if (c.notifyByCall && c.priority === 1) {
        perContact.call = (await this.notifications.placeCall(c.phone, callScript, meta)).ok;
      }
      results.push(perContact);
    }

    // Record the alert on the incident timeline.
    await this.prisma.incidentEvent.create({
      data: {
        incidentId,
        type: 'NOTIFICATION',
        payload: { kind: 'contacts-alerted', count: contacts.length },
      },
    });

    return { trackingLink: link, notified: results.length, results };
  }

  private async ensureTrackingToken(incidentId: string, existing: string | null): Promise<string> {
    if (existing) return existing;
    const token = randomBytes(12).toString('base64url');
    await this.prisma.incident.update({
      where: { id: incidentId },
      data: { trackingToken: token, trackingEnabledAt: new Date() },
    });
    return token;
  }

  /** Public, read-only live status resolved by a tracking token. */
  async publicTracking(token: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { trackingToken: token },
      include: {
        reporter: { select: { displayName: true } },
        ambulanceRequest: { include: { ambulance: { select: { vehicleNumber: true } } } },
      },
    });
    if (!incident) throw new NotFoundException('Tracking link is invalid or expired');
    return {
      status: incident.status,
      severity: incident.severity,
      chiefComplaint: incident.chiefComplaint,
      location:
        incident.latitude != null && incident.longitude != null
          ? { latitude: incident.latitude, longitude: incident.longitude, address: incident.address }
          : null,
      ambulance: incident.ambulanceRequest
        ? {
            status: incident.ambulanceRequest.status,
            etaSeconds: incident.ambulanceRequest.etaSeconds,
            vehicleNumber: incident.ambulanceRequest.ambulance?.vehicleNumber,
          }
        : null,
      person: incident.reporter.displayName ?? 'Unknown',
      updatedAt: incident.updatedAt,
      notice: 'Live emergency tracking. Not a diagnosis. Call local emergency services if needed.',
    };
  }
}
