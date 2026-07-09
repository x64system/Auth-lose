import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUrl, IsNumber, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProductDto {
  @ApiProperty({ example: "Bypass Cheat" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "Premium injector bypass" })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: "1.0.0" })
  @IsString()
  @IsNotEmpty()
  version!: string;

  @ApiProperty({ example: "Software" })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ enum: ["active", "inactive", "beta"], example: "active" })
  @IsEnum(["active", "inactive", "beta"])
  status!: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ required: false, example: 19.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;
}
