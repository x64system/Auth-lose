import { IsString, IsEnum, IsBoolean, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RoleName } from "@prisma/client";

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: RoleName, required: false })
  @IsEnum(RoleName)
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
