import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GuidanceService } from './guidance.service';
import { Public } from '../common/decorators/public.decorator';

// First-aid guidance is public reference content — available without auth so it
// works in guest/offline scenarios.
@ApiTags('guidance')
@Controller('guidance')
export class GuidanceController {
  constructor(private readonly service: GuidanceService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List first-aid topics (optionally by category)' })
  @ApiQuery({ name: 'category', required: false })
  list(@Query('category') category?: string) {
    return this.service.list(category);
  }

  @Public()
  @Get('bundle')
  @ApiOperation({ summary: 'Full offline guidance bundle with checksum' })
  bundle() {
    return this.service.bundle();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get one first-aid topic with full steps' })
  get(@Param('slug') slug: string) {
    return this.service.get(slug);
  }
}
