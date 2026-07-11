import { ApiPropertyOptional } from '@nestjs/swagger';
import { BloodGroup, Gender } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMedicalProfileDto {
  @ApiPropertyOptional({ enum: BloodGroup })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: '1990-05-14T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 72.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weightKg?: number;

  @ApiPropertyOptional({ example: 178 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOrganDonor?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPregnant?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['Penicillin', 'Peanuts'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Metformin 500mg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Type 2 Diabetes', 'Asthma'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Appendectomy 2015'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previousSurgeries?: string[];

  @ApiPropertyOptional({ description: 'Insurance details (stored encrypted)' })
  @IsOptional()
  @IsString()
  insuranceInfo?: string;
}

export class EmergencyContactDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '+14155550101' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ example: 'Spouse' })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyBySms?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyByCall?: boolean;
}

export class SetEmergencyContactsDto {
  @ApiPropertyOptional({ type: [EmergencyContactDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  contacts!: EmergencyContactDto[];
}
