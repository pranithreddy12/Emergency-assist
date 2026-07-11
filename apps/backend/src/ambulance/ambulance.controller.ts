import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AmbulanceService } from './ambulance.service';
import { BookAmbulanceDto } from './dto/ambulance.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('ambulance')
@ApiBearerAuth()
@Controller('ambulance')
export class AmbulanceController {
  constructor(private readonly service: AmbulanceService) {}

  @Post('book')
  @ApiOperation({ summary: 'One-tap booking — assigns the nearest available ambulance' })
  book(@CurrentUser() user: AuthUser, @Body() dto: BookAmbulanceDto) {
    return this.service.book(user.userId, dto);
  }

  @Get('requests')
  @ApiOperation({ summary: 'List my ambulance requests' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.listMine(user.userId);
  }

  @Get('requests/:id/track')
  @ApiOperation({ summary: 'Track a request — live ETA and driver details' })
  track(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.track(user.userId, id);
  }

  @Delete('requests/:id')
  @ApiOperation({ summary: 'Cancel an ambulance request' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.cancel(user.userId, id);
  }
}
