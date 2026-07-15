import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, Matches } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ example: 'Discharge summary 2025' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  contentType!: string;

  @ApiProperty({ description: 'Base64-encoded file contents' })
  @IsString()
  @Matches(/^[A-Za-z0-9+/=\r\n]+$/, { message: 'data must be base64' })
  data!: string;
}
