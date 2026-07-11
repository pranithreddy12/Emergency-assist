import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PrearrivalService } from './prearrival.service';
import { SendPrearrivalDto, AcknowledgePrearrivalDto } from './dto/prearrival.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('prearrival')
@ApiBearerAuth()
@Controller()
export class PrearrivalController {
  constructor(private readonly service: PrearrivalService) {}

  // ── Patient side ──
  @Post('incidents/:id/prearrival')
  @ApiOperation({ summary: 'Send a pre-arrival hand-off to a hospital' })
  send(
    @CurrentUser() user: AuthUser,
    @Param('id') incidentId: string,
    @Body() dto: SendPrearrivalDto,
  ) {
    return this.service.send(user.userId, incidentId, dto.hospitalId);
  }

  @Get('prearrivals/:id')
  @ApiOperation({ summary: 'Get a pre-arrival record' })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  // ── Hospital side (RBAC) ──
  @Get('hospitals/:hospitalId/prearrivals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOSPITAL_STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Hospital inbox of incoming patients (staff only)' })
  inbox(@Param('hospitalId') hospitalId: string) {
    return this.service.listForHospital(hospitalId);
  }

  @Post('prearrivals/:id/acknowledge')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOSPITAL_STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Acknowledge or decline an incoming patient (staff only)' })
  acknowledge(@Param('id') id: string, @Body() dto: AcknowledgePrearrivalDto) {
    return this.service.acknowledge(id, dto);
  }
}
