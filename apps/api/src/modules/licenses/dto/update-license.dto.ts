import { IsString, IsEnum, IsOptional, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

const LicenseStatuses = ["ACTIVE", "INACTIVE", "EXPIRED", "REVOKED"] as const;
type LicenseStatus = (typeof LicenseStatuses)[number];

export class UpdateLicenseDto {
  @ApiProperty({ enum: LicenseStatuses, required: false })
  @IsEnum(LicenseStatuses)
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
