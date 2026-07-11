import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('timeline')
@ApiBearerAuth()
@Controller('timeline')
export class TimelineController {
  constructor(private readonly service: TimelineService) {}

  @Get()
  @ApiOperation({ summary: 'My medical timeline (incidents, ambulances, documents)' })
  timeline(@CurrentUser() user: AuthUser) {
    return this.service.forUser(user.userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'My timeline summary counts' })
  summary(@CurrentUser() user: AuthUser) {
    return this.service.summary(user.userId);
  }
}
