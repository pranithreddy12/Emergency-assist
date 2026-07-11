import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AmbulanceType } from '@prisma/client';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BookAmbulanceDto {
  @ApiProperty({ example: 37.7749 })
  @Type(() => Number)
  @IsLatitude()
  pickupLat!: number;

  @ApiProperty({ example: -122.4194 })
  @Type(() => Number)
  @IsLongitude()
  pickupLng!: number;

  @ApiPropertyOptional({ example: '1 Market St, San Francisco' })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiPropertyOptional({ description: 'Link this request to an incident' })
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @ApiPropertyOptional({ description: 'Preferred destination hospital' })
  @IsOptional()
  @IsUUID()
  destinationHospitalId?: string;

  @ApiPropertyOptional({ enum: AmbulanceType, default: AmbulanceType.BLS })
  @IsOptional()
  @IsEnum(AmbulanceType)
  type?: AmbulanceType;
}
