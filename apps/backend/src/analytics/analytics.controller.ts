import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

// System-wide analytics — admin only.
@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Emergency statistics overview' })
  overview() {
    return this.service.overview();
  }

  @Get('response-times')
  @ApiOperation({ summary: 'Dispatch latency and ambulance ETA statistics' })
  responseTimes() {
    return this.service.responseTimes();
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Incident location heatmap (bucketed points)' })
  heatmap() {
    return this.service.heatmap();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Incidents per day' })
  @ApiQuery({ name: 'days', required: false })
  trends(@Query('days') days?: string) {
    return this.service.trends(days ? Number(days) : 14);
  }
}
