import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TriageService } from './triage.service';
import { AssessTriageDto } from './dto/triage.dto';

@ApiTags('triage')
@ApiBearerAuth()
@Controller('triage')
export class TriageController {
  constructor(private readonly triage: TriageService) {}

  @Post('assess')
  @ApiOperation({
    summary: 'Assess an emergency and return a structured triage report',
    description:
      'Returns severity, confidence and first-aid guidance. Never diagnoses or prescribes.',
  })
  assess(@Body() dto: AssessTriageDto) {
    return this.triage.assess(dto);
  }
}
