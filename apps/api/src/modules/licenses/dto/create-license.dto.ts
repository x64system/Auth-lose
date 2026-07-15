import { IsString, IsNotEmpty, IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateLicenseDto {
  @ApiProperty({ example: "product-cuid-here" })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ enum: ["trial", "1d", "7d", "30d", "90d", "180d", "365d", "lifetime"], example: "30d" })
  @IsEnum(["trial", "1d", "7d", "30d", "90d", "180d", "365d", "lifetime"])
  type!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  device?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  code?: string;
}
