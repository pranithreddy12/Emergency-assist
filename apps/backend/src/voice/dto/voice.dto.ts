import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TranscribeDto {
  @ApiProperty({ description: 'Base64-encoded audio clip' })
  @IsString()
  audioBase64!: string;

  @ApiPropertyOptional({ example: 'audio/webm' })
  @IsOptional()
  @IsString()
  mime?: string;
}

export class SpeakDto {
  @ApiProperty({ example: 'Stay calm. Help is on the way.' })
  @IsString()
  text!: string;
}

export class AssistDto {
  @ApiProperty({ description: 'Base64-encoded audio of the caller describing the emergency' })
  @IsString()
  audioBase64!: string;

  @ApiPropertyOptional({ example: 'audio/webm' })
  @IsOptional()
  @IsString()
  mime?: string;
}
