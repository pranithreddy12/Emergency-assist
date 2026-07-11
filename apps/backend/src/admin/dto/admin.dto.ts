import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  AmbulanceStatus,
  AmbulanceType,
  FacilityCapability,
  UserRole,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHospitalDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() address!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @Type(() => Number) @IsLatitude() latitude!: number;
  @ApiProperty() @Type(() => Number) @IsLongitude() longitude!: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional() @Type(() => Number) @Min(0) @Max(5)
  rating?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isOpen24h?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasEmergency?: boolean;

  @ApiPropertyOptional({ enum: FacilityCapability, isArray: true })
  @IsOptional() @IsArray() @IsEnum(FacilityCapability, { each: true })
  capabilities?: FacilityCapability[];

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  availableBeds?: number;
}

export class UpdateHospitalDto extends PartialType(CreateHospitalDto) {}

export class CreateAmbulanceDto {
  @ApiProperty() @IsString() vehicleNumber!: string;
  @ApiProperty() @IsString() driverName!: string;
  @ApiProperty() @IsString() driverPhone!: string;
  @ApiPropertyOptional({ enum: AmbulanceType })
  @IsOptional() @IsEnum(AmbulanceType) type?: AmbulanceType;
  @ApiProperty() @Type(() => Number) @IsLatitude() latitude!: number;
  @ApiProperty() @Type(() => Number) @IsLongitude() longitude!: number;
}

export class UpdateAmbulanceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() driverName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() driverPhone?: string;
  @ApiPropertyOptional({ enum: AmbulanceType })
  @IsOptional() @IsEnum(AmbulanceType) type?: AmbulanceType;
  @ApiPropertyOptional({ enum: AmbulanceStatus })
  @IsOptional() @IsEnum(AmbulanceStatus) status?: AmbulanceStatus;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsLatitude() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsLongitude() longitude?: number;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;
}
