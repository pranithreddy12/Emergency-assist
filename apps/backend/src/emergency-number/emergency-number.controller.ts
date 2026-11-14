import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EmergencyNumberService } from './emergency-number.service';
import { Public } from '../common/decorators/public.decorator';

// Public reference content, like guidance — a guest must be able to learn the
// right number to dial without an account.
@ApiTags('emergency-number')
@Controller('emergency-number')
export class EmergencyNumberController {
  constructor(private readonly service: EmergencyNumberService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Local emergency/ambulance number for a country (ISO 3166-1 alpha-2)' })
  @ApiQuery({ name: 'country', required: false, example: 'GB' })
  forCountry(@Query('country') country?: string) {
    return this.service.forCountry(country);
  }
}
