import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { CreateIncidentDto, UpdateIncidentStatusDto } from './dto/emergency.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('emergency')
@ApiBearerAuth()
@Controller('incidents')
export class EmergencyController {
  constructor(private readonly service: EmergencyService) {}

  @Post()
  @ApiOperation({ summary: 'Raise an SOS — runs triage and creates an active incident' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateIncidentDto) {
    return this.service.createIncident(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my incidents' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.listIncidents(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one incident with report and timeline' })
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getIncident(user.userId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Advance the incident state machine' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
  ) {
    return this.service.updateStatus(user.userId, id, dto);
  }
}
