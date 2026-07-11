import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FieldCryptoService } from '../common/crypto/field-crypto.service';
import {
  UpdateMedicalProfileDto,
  SetEmergencyContactsDto,
} from './dto/medical-profile.dto';

@Injectable()
export class MedicalProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: FieldCryptoService,
  ) {}

  /** Ensures a profile row exists for the user (guests may not have one yet). */
  private async ensure(userId: string) {
    const existing = await this.prisma.medicalProfile.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.medicalProfile.create({ data: { userId } });
  }

  async get(userId: string) {
    const profile = await this.prisma.medicalProfile.findUnique({
      where: { userId },
      include: { emergencyContacts: { orderBy: { priority: 'asc' } }, documents: true },
    });
    if (!profile) return this.decrypt(await this.ensure(userId));
    return this.decrypt(profile);
  }

  async update(userId: string, dto: UpdateMedicalProfileDto) {
    await this.ensure(userId);
    const data: Record<string, unknown> = { ...dto };
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.insuranceInfo !== undefined) {
      data.insuranceInfo = dto.insuranceInfo ? this.crypto.encrypt(dto.insuranceInfo) : null;
    }
    const updated = await this.prisma.medicalProfile.update({
      where: { userId },
      data,
      include: { emergencyContacts: { orderBy: { priority: 'asc' } }, documents: true },
    });
    return this.decrypt(updated);
  }

  async setContacts(userId: string, dto: SetEmergencyContactsDto) {
    const profile = await this.ensure(userId);
    await this.prisma.emergencyContact.deleteMany({ where: { profileId: profile.id } });
    await this.prisma.emergencyContact.createMany({
      data: dto.contacts.map((c) => ({
        profileId: profile.id,
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
        priority: c.priority ?? 1,
        notifyBySms: c.notifyBySms ?? true,
        notifyByCall: c.notifyByCall ?? true,
      })),
    });
    return this.get(userId);
  }

  /**
   * Read-only emergency card resolved from the public QR token.
   * Deliberately excludes contact info & insurance — only what a responder
   * needs at the scene. No auth required (the token is the capability).
   */
  async cardByToken(qrToken: string) {
    const profile = await this.prisma.medicalProfile.findUnique({
      where: { qrToken },
      include: { user: { select: { displayName: true } } },
    });
    if (!profile) throw new NotFoundException('Medical card not found');
    return {
      name: profile.user.displayName ?? 'Unknown',
      bloodGroup: profile.bloodGroup,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      allergies: profile.allergies,
      medications: profile.medications,
      chronicConditions: profile.chronicConditions,
      isOrganDonor: profile.isOrganDonor,
      isPregnant: profile.isPregnant,
      generatedAt: new Date().toISOString(),
      notice: 'Emergency medical card. Not a diagnosis. Call local emergency services.',
    };
  }

  private decrypt<T extends { insuranceInfo: string | null }>(profile: T): T {
    if (profile.insuranceInfo) {
      try {
        return { ...profile, insuranceInfo: this.crypto.decrypt(profile.insuranceInfo) };
      } catch {
        return { ...profile, insuranceInfo: null };
      }
    }
    return profile;
  }
}
