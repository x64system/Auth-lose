import { Controller, Get, Put, Delete, Body, Param, Req, UseGuards, ForbiddenException } from "@nestjs/common";
import { Request } from "express";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard, getRoleLevel } from "../auth/roles.guard";
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

  /**
   * Apenas ADMIN e SUPER_ADMIN podem alterar dados.
   *
   * Proteção extra contra escalada de privilégios: ninguém pode atribuir
   * um cargo superior ao seu próprio, nem editar alguém com cargo já
   * superior ao seu.
   */
  @Roles("ADMIN", "SUPER_ADMIN")
  @Put(":id")
  @ApiOperation({ summary: "Update a user profile or settings" })
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto, @Req() req: Request) {
    const caller = (req as any).user as { role: string };
    const callerLevel = getRoleLevel(caller.role);

    if (dto.role && getRoleLevel(dto.role) > callerLevel) {
      throw new ForbiddenException(
        `Não pode atribuir um cargo (${dto.role}) superior ao seu próprio (${caller.role})`
      );
    }

    const target = await this.usersService.findOne(id);
    if (getRoleLevel(target.role) > callerLevel) {
      throw new ForbiddenException("Não pode editar um utilizador com cargo superior ao seu");
    }

    return this.usersService.update(id, dto);
  }

  /** Apenas SUPER_ADMIN pode deletar utilizadores */
  @Roles("SUPER_ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a user" })
  async remove(@Param("id") id: string, @Req() req: Request) {
    const caller = (req as any).user as { sub: string };
    if (caller.sub === id) {
      throw new ForbiddenException("Não pode eliminar a sua própria conta");
    }
    return this.usersService.remove(id);
  }
}
