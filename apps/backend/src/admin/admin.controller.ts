import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  CreateHospitalDto,
  UpdateHospitalDto,
  CreateAmbulanceDto,
  UpdateAmbulanceDto,
  UpdateUserRoleDto,
} from './dto/admin.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  // ── Hospitals ──
  @Get('hospitals')
  @ApiOperation({ summary: 'List all hospitals' })
  listHospitals() {
    return this.service.listHospitals();
  }
  @Post('hospitals')
  @ApiOperation({ summary: 'Create a hospital' })
  createHospital(@Body() dto: CreateHospitalDto) {
    return this.service.createHospital(dto);
  }
  @Patch('hospitals/:id')
  @ApiOperation({ summary: 'Update a hospital' })
  updateHospital(@Param('id') id: string, @Body() dto: UpdateHospitalDto) {
    return this.service.updateHospital(id, dto);
  }
  @Delete('hospitals/:id')
  @ApiOperation({ summary: 'Delete a hospital' })
  deleteHospital(@Param('id') id: string) {
    return this.service.deleteHospital(id);
  }

  // ── Ambulances ──
  @Get('ambulances')
  @ApiOperation({ summary: 'List all ambulances' })
  listAmbulances() {
    return this.service.listAmbulances();
  }
  @Post('ambulances')
  @ApiOperation({ summary: 'Create an ambulance' })
  createAmbulance(@Body() dto: CreateAmbulanceDto) {
    return this.service.createAmbulance(dto);
  }
  @Patch('ambulances/:id')
  @ApiOperation({ summary: 'Update an ambulance (status/location/driver)' })
  updateAmbulance(@Param('id') id: string, @Body() dto: UpdateAmbulanceDto) {
    return this.service.updateAmbulance(id, dto);
  }
  @Delete('ambulances/:id')
  @ApiOperation({ summary: 'Delete an ambulance' })
  deleteAmbulance(@Param('id') id: string) {
    return this.service.deleteAmbulance(id);
  }

  // ── Users ──
  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  listUsers() {
    return this.service.listUsers();
  }
  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change a user role' })
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.service.updateUserRole(id, dto);
  }

  // ── Incidents ──
  @Get('incidents')
  @ApiOperation({ summary: 'List all incidents (system-wide)' })
  @ApiQuery({ name: 'status', required: false })
  listIncidents(@Query('status') status?: string) {
    return this.service.listIncidents(status);
  }

  // ── Audit ──
  @Get('audit-logs')
  @ApiOperation({ summary: 'View the audit trail (most recent first)' })
  @ApiQuery({ name: 'limit', required: false })
  auditLogs(@Query('limit') limit?: string) {
    return this.service.listAuditLogs(limit ? Number(limit) : 100);
  }
}
