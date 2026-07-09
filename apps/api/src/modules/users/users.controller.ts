import { Controller, Get, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Qualquer admin pode listar utilizadores */
  @Roles("ADMIN", "SUPER_ADMIN", "MODERATOR", "SUPPORT")
  @Get()
  @ApiOperation({ summary: "List all users" })
  findAll() {
    return this.usersService.findAll();
  }

  /** Qualquer admin pode ver detalhes */
  @Roles("ADMIN", "SUPER_ADMIN", "MODERATOR", "SUPPORT")
  @Get(":id")
  @ApiOperation({ summary: "Get details of a single user" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  /** Apenas ADMIN e SUPER_ADMIN podem alterar dados */
  @Roles("ADMIN", "SUPER_ADMIN")
  @Put(":id")
  @ApiOperation({ summary: "Update a user profile or settings" })
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /** Apenas SUPER_ADMIN pode deletar utilizadores */
  @Roles("SUPER_ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a user" })
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
