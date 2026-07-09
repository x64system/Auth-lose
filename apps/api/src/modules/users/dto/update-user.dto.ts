import { IsString, IsEnum, IsBoolean, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

const RoleNames = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "DEVELOPER", "CUSTOMER", "USER"] as const;
type RoleName = (typeof RoleNames)[number];

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: RoleNames, required: false })
  @IsEnum(RoleNames)
  @IsOptional()
  role?: RoleName;

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
