import { IsString, IsEnum, IsOptional, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { LicenseStatus } from "@prisma/client";

export class UpdateLicenseDto {
  @ApiProperty({ enum: LicenseStatus, required: false })
  @IsEnum(LicenseStatus)
  @IsOptional()
  status?: LicenseStatus;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  device?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string;
}
