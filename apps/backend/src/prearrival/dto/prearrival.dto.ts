import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendPrearrivalDto {
  @ApiProperty({ description: 'Destination hospital id' })
  @IsUUID()
  hospitalId!: string;
}

export class AcknowledgePrearrivalDto {
  @ApiPropertyOptional({ example: 'Trauma bay 2 ready; ETA noted.' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Decline instead of accept', default: false })
  @IsOptional()
  @IsBoolean()
  decline?: boolean;
}
