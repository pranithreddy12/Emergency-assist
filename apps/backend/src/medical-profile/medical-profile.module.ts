import { Module } from '@nestjs/common';
import { MedicalProfileService } from './medical-profile.service';
import { MedicalProfileController } from './medical-profile.controller';

@Module({
  controllers: [MedicalProfileController],
  providers: [MedicalProfileService],
  exports: [MedicalProfileService],
})
export class MedicalProfileModule {}
