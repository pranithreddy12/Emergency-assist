import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AssessTriageDto {
  @ApiProperty({ example: 'Man clutching his chest and short of breath' })
  @IsString()
  chiefComplaint!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isConscious?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBreathing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasBleeding?: boolean;

  @ApiPropertyOptional({ example: 58 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  patientAge?: number;

  @ApiPropertyOptional({ type: [String], example: ['sweating', 'left arm pain'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @ApiPropertyOptional({ description: 'Free-form description (from voice/text)' })
  @IsOptional()
  @IsString()
  freeText?: string;
}
