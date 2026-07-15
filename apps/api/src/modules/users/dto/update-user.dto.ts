import { IsString, IsBoolean, IsOptional, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: ["USER", "CUSTOMER", "SUPPORT", "DEVELOPER", "MODERATOR", "ADMIN", "SUPER_ADMIN"], required: false })
  @IsIn(["USER", "CUSTOMER", "SUPPORT", "DEVELOPER", "MODERATOR", "ADMIN", "SUPER_ADMIN"])
  @IsOptional()
  role?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isBanned?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  theme?: string;
}
