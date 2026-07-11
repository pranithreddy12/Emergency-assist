import { Module } from '@nestjs/common';
import { GuidanceService } from './guidance.service';
import { GuidanceController } from './guidance.controller';

@Module({
  controllers: [GuidanceController],
  providers: [GuidanceService],
  exports: [GuidanceService],
})
export class GuidanceModule {}
