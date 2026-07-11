import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { SearchHospitalsDto } from './dto/hospital.dto';

@ApiTags('hospitals')
@ApiBearerAuth()
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly service: HospitalsService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search nearby hospitals with filters, travel time and sorting',
  })
  search(@Query() dto: SearchHospitalsDto) {
    return this.service.search(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one hospital by id' })
  get(@Param('id') id: string) {
    return this.service.getById(id);
  }
}
