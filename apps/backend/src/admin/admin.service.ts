import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateHospitalDto,
  UpdateHospitalDto,
  CreateAmbulanceDto,
  UpdateAmbulanceDto,
  UpdateUserRoleDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Hospitals ──
  listHospitals() {
    return this.prisma.hospital.findMany({ orderBy: { name: 'asc' } });
  }
  createHospital(dto: CreateHospitalDto) {
    return this.prisma.hospital.create({ data: dto });
  }
  async updateHospital(id: string, dto: UpdateHospitalDto) {
    await this.mustExist('hospital', id);
    return this.prisma.hospital.update({ where: { id }, data: dto });
  }
  async deleteHospital(id: string) {
    await this.mustExist('hospital', id);
    await this.prisma.hospital.delete({ where: { id } });
    return { deleted: id };
  }

  // ── Ambulances ──
  listAmbulances() {
    return this.prisma.ambulance.findMany({ orderBy: { vehicleNumber: 'asc' } });
  }
  createAmbulance(dto: CreateAmbulanceDto) {
    return this.prisma.ambulance.create({ data: dto });
  }
  async updateAmbulance(id: string, dto: UpdateAmbulanceDto) {
    await this.mustExist('ambulance', id);
    return this.prisma.ambulance.update({ where: { id }, data: dto });
  }
  async deleteAmbulance(id: string) {
    await this.mustExist('ambulance', id);
    await this.prisma.ambulance.delete({ where: { id } });
    return { deleted: id };
  }

  // ── Users ──
  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        provider: true,
        isGuest: true,
        isVerified: true,
        displayName: true,
        createdAt: true,
      },
    });
  }
  async updateUserRole(id: string, dto: UpdateUserRoleDto) {
    await this.mustExist('user', id);
    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: { id: true, email: true, role: true },
    });
  }

  // ── Incidents (system-wide view) ──
  listIncidents(status?: string) {
    return this.prisma.incident.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, displayName: true, email: true } },
        triageReport: { select: { severity: true, confidence: true } },
        ambulanceRequest: { select: { status: true } },
      },
      take: 200,
    });
  }

  // ── Audit logs ──
  listAuditLogs(limit = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
      include: { user: { select: { email: true, role: true } } },
    });
  }

  private async mustExist(model: 'hospital' | 'ambulance' | 'user', id: string) {
    // Narrow delegate access without `any`.
    const found =
      model === 'hospital'
        ? await this.prisma.hospital.findUnique({ where: { id } })
        : model === 'ambulance'
          ? await this.prisma.ambulance.findUnique({ where: { id } })
          : await this.prisma.user.findUnique({ where: { id } });
    if (!found) throw new NotFoundException(`${model} not found`);
  }
}
