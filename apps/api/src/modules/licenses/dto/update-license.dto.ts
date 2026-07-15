import { IsString, IsOptional, IsDateString, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateLicenseDto {
  @ApiProperty({ enum: ["ACTIVE", "INACTIVE", "EXPIRED", "REVOKED"], required: false })
  @IsIn(["ACTIVE", "INACTIVE", "EXPIRED", "REVOKED"])
  @IsOptional()
  status?: string;

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
