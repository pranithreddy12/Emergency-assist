import { Module } from '@nestjs/common';
import { RecognizerService } from './recognizer.service';
import { RecognizerController } from './recognizer.controller';
import { EmergencyNumberModule } from '../emergency-number/emergency-number.module';

@Module({
  imports: [EmergencyNumberModule],
  controllers: [RecognizerController],
  providers: [RecognizerService],
  exports: [RecognizerService],
})
export class RecognizerModule {}
