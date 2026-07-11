import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { TranscribeDto, SpeakDto, AssistDto } from './dto/voice.dto';

@ApiTags('voice')
@ApiBearerAuth()
@Controller('voice')
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Post('transcribe')
  @ApiOperation({ summary: 'Speech-to-text' })
  transcribe(@Body() dto: TranscribeDto) {
    return this.voice.transcribe(dto.audioBase64, dto.mime);
  }

  @Post('speak')
  @ApiOperation({ summary: 'Text-to-speech' })
  speak(@Body() dto: SpeakDto) {
    return this.voice.speak(dto.text);
  }

  @Post('assist')
  @ApiOperation({
    summary: 'Hands-free voice assist: transcribe → triage → spoken guidance',
  })
  assist(@Body() dto: AssistDto) {
    return this.voice.assist(dto.audioBase64, dto.mime);
  }
}
