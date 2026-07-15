import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@ApiTags("products")
@Controller("products")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles("SUPPORT", "DEVELOPER", "MODERATOR", "ADMIN", "SUPER_ADMIN")
  @Get()
  @ApiOperation({ summary: "List all products" })
  findAll() {
    return this.productsService.findAll();
  }

  @Roles("SUPPORT", "DEVELOPER", "MODERATOR", "ADMIN", "SUPER_ADMIN")
  @Get(":id")
  @ApiOperation({ summary: "Get a single product details" })
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Roles("DEVELOPER", "MODERATOR", "ADMIN", "SUPER_ADMIN")
  @Post()
  @ApiOperation({ summary: "Create a new product" })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles("DEVELOPER", "MODERATOR", "ADMIN", "SUPER_ADMIN")
  @Put(":id")
  @ApiOperation({ summary: "Update an existing product" })
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles("DEVELOPER", "MODERATOR", "ADMIN", "SUPER_ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a product" })
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
