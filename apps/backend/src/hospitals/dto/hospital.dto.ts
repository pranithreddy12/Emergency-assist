import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FacilityCapability } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum HospitalSort {
  DISTANCE = 'distance',
  RATING = 'rating',
  TRAVEL_TIME = 'travelTime',
}

export class SearchHospitalsDto {
  @ApiProperty({ example: 37.7749 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: -122.4194 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ enum: FacilityCapability, description: 'Required capability' })
  @IsOptional()
  @IsEnum(FacilityCapability)
  capability?: FacilityCapability;

  @ApiPropertyOptional({ description: 'Max straight-line radius in km', example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number;

  @ApiPropertyOptional({ description: 'Only hospitals open now (24h or hasEmergency)' })
  @IsOptional()
  @Type(() => Boolean)
  openNow?: boolean;

  @ApiPropertyOptional({ enum: HospitalSort, default: HospitalSort.DISTANCE })
  @IsOptional()
  @IsEnum(HospitalSort)
  sort?: HospitalSort;

  @ApiPropertyOptional({ default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
