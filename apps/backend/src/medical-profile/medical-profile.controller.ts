import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalProfileService } from './medical-profile.service';
import {
  UpdateMedicalProfileDto,
  SetEmergencyContactsDto,
} from './dto/medical-profile.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('medical-profile')
@Controller()
export class MedicalProfileController {
  constructor(private readonly service: MedicalProfileService) {}

  @ApiBearerAuth()
  @Get('medical-profile')
  @ApiOperation({ summary: 'Get my medical profile' })
  get(@CurrentUser() user: AuthUser) {
    return this.service.get(user.userId);
  }

  @ApiBearerAuth()
  @Put('medical-profile')
  @ApiOperation({ summary: 'Update my medical profile' })
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateMedicalProfileDto) {
    return this.service.update(user.userId, dto);
  }

  @ApiBearerAuth()
  @Put('medical-profile/contacts')
  @ApiOperation({ summary: 'Replace my emergency contacts' })
  setContacts(@CurrentUser() user: AuthUser, @Body() dto: SetEmergencyContactsDto) {
    return this.service.setContacts(user.userId, dto);
  }

  @Public()
  @Get('medical-card/:qrToken')
  @ApiOperation({ summary: 'Public read-only emergency card resolved by QR token' })
  card(@Param('qrToken') qrToken: string) {
    return this.service.cardByToken(qrToken);
  }
}
