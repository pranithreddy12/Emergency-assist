import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('contacts')
@Controller()
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @ApiBearerAuth()
  @Post('incidents/:id/alert-contacts')
  @ApiOperation({ summary: 'Alert my emergency contacts with a live-tracking link' })
  alert(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.alertContacts(user.userId, id);
  }

  @Public()
  @Get('track/:token')
  @ApiOperation({ summary: 'Public live incident tracking resolved by token' })
  track(@Param('token') token: string) {
    return this.service.publicTracking(token);
  }
}
