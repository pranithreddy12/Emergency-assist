import { Module } from '@nestjs/common';
import { AmbulanceService } from './ambulance.service';
import { AmbulanceController } from './ambulance.controller';
import { EmergencyModule } from '../emergency/emergency.module';

@Module({
  imports: [EmergencyModule], // reuses EmergencyGateway for live incident events
  controllers: [AmbulanceController],
  providers: [AmbulanceService],
  exports: [AmbulanceService],
})
export class AmbulanceModule {}
