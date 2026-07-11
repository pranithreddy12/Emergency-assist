import { Module } from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import { EmergencyController } from './emergency.controller';
import { EmergencyGateway } from './emergency.gateway';
import { TriageModule } from '../triage/triage.module';

@Module({
  imports: [TriageModule],
  controllers: [EmergencyController],
  providers: [EmergencyService, EmergencyGateway],
  exports: [EmergencyService, EmergencyGateway],
})
export class EmergencyModule {}
