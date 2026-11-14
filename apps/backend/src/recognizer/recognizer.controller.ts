import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RecognizerService } from './recognizer.service';
import { Public } from '../common/decorators/public.decorator';

// The "What's happening?" recognizer is public reference content — no auth, so
// it works for a guest and offline, exactly like the guidance it routes to.
@ApiTags('recognizer')
@Controller('recognizer')
export class RecognizerController {
  constructor(private readonly service: RecognizerService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Start the "What\'s happening?" recognizer (root question)' })
  @ApiQuery({ name: 'country', required: false, example: 'GB' })
  start(@Query('country') country?: string) {
    return this.service.start(country);
  }

  @Public()
  @Get('bundle')
  @ApiOperation({ summary: 'Full offline recognizer tree with checksum' })
  bundle() {
    return this.service.bundle();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get one recognizer node by id' })
  @ApiQuery({ name: 'country', required: false, example: 'GB' })
  node(@Param('id') id: string, @Query('country') country?: string) {
    return this.service.node(id, country);
  }
}
