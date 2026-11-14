import { Module } from '@nestjs/common';
import { EmergencyNumberService } from './emergency-number.service';
import { EmergencyNumberController } from './emergency-number.controller';

@Module({
  controllers: [EmergencyNumberController],
  providers: [EmergencyNumberService],
  exports: [EmergencyNumberService],
})
export class EmergencyNumberModule {}
