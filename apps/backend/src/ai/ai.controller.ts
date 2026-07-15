import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AnalyzeImageDto, TranslateDto } from './dto/ai.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('analyze-image')
  @ApiOperation({
    summary: 'Analyze an emergency photo (observations + triage). Never diagnoses.',
  })
  analyzeImage(@Body() dto: AnalyzeImageDto) {
    return this.ai.analyzeImage(dto.imageBase64, dto.mime);
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate text (e.g. guidance) to another language' })
  translate(@Body() dto: TranslateDto) {
    return this.ai.translate(dto.text, dto.targetLanguage);
  }
}
