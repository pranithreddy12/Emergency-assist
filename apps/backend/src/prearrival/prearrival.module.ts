import { Module } from '@nestjs/common';
import { PrearrivalService } from './prearrival.service';
import { PrearrivalController } from './prearrival.controller';
import { EmergencyModule } from '../emergency/emergency.module';

@Module({
  imports: [EmergencyModule], // reuses EmergencyGateway for live incident events
  controllers: [PrearrivalController],
  providers: [PrearrivalService],
  exports: [PrearrivalService],
})
export class PrearrivalModule {}
