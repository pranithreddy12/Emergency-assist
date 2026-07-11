import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentStatus } from '@prisma/client';
import { AssessTriageDto } from '../../triage/dto/triage.dto';

export class CreateIncidentDto {
  @ApiPropertyOptional({ example: 37.7749 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -122.4194 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: '1 Market St, San Francisco' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ type: AssessTriageDto })
  @ValidateNested()
  @Type(() => AssessTriageDto)
  triage!: AssessTriageDto;
}

export class UpdateIncidentStatusDto {
  @ApiProperty({ enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
