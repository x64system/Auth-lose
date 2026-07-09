import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { LicensesService } from "./licenses.service";
import { CreateLicenseDto } from "./dto/create-license.dto";
import { UpdateLicenseDto } from "./dto/update-license.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@ApiTags("licenses")
@Controller("licenses")
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Get()
  @ApiOperation({ summary: "List all license keys" })
  findAll() {
    return this.licensesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get details of a single license key" })
  findOne(@Param("id") id: string) {
    return this.licensesService.findOne(id);
  }

  /** ADMIN, MODERATOR e DEVELOPER podem gerar keys */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "MODERATOR", "DEVELOPER")
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: "Generate a new license key" })
  create(@Body() dto: CreateLicenseDto) {
    return this.licensesService.create(dto);
  }

  /** ADMIN pode alterar status / expiração */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "MODERATOR")
  @ApiBearerAuth()
  @Put(":id")
  @ApiOperation({ summary: "Update a license key status, expirations, or owner" })
  update(@Param("id") id: string, @Body() dto: UpdateLicenseDto) {
    return this.licensesService.update(id, dto);
  }

  /** Apenas SUPER_ADMIN pode deletar keys permanentemente */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @Delete(":id")
  @ApiOperation({ summary: "Delete/revoke a license key" })
  remove(@Param("id") id: string) {
    return this.licensesService.remove(id);
  }
}
