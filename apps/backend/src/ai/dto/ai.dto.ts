import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AnalyzeImageDto {
  @ApiProperty({ description: 'Base64-encoded image of the emergency scene' })
  @IsString()
  imageBase64!: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mime?: string;
}

export class TranslateDto {
  @ApiProperty({ example: 'Apply firm pressure to the wound.' })
  @IsString()
  @MaxLength(5000)
  text!: string;

  @ApiProperty({ example: 'Spanish' })
  @IsString()
  targetLanguage!: string;
}
