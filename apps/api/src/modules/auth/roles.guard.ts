import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, AppRole } from "./roles.decorator";

/**
 * Hierarquia de cargos: índice maior = mais permissões.
 * SUPER_ADMIN pode fazer tudo que cargos abaixo podem.
 */
const ROLE_HIERARCHY: AppRole[] = [
  "USER",
  "CUSTOMER",
  "SUPPORT",
  "DEVELOPER",
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN"
];

function getRoleLevel(role: string): number {
  const idx = ROLE_HIERARCHY.indexOf(role as AppRole);
  return idx === -1 ? -1 : idx;
}

/**
 * Guard que verifica se o utilizador autenticado possui um dos cargos
 * exigidos pelo decorator @Roles(...) — respeitando a hierarquia.
 *
 * Um utilizador com cargo de maior nível pode aceder a qualquer rota
 * de nível inferior. Ex: SUPER_ADMIN passa em qualquer rota.
 *
 * Deve ser usado APÓS o JwtAuthGuard (depende de request["user"]).
 * Se nenhum cargo estiver definido no handler, o acesso é permitido.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    // Sem restrição de cargo → permite
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request["user"] as { role?: string } | undefined;

    if (!user?.role) {
      throw new ForbiddenException("Acesso negado: cargo não identificado");
    }

    const userLevel = getRoleLevel(user.role);

    // Nível mínimo exigido = o mais baixo da lista de roles permitidas
    // (quem é SUPER_ADMIN passa em tudo; quem é ADMIN passa em rotas de MODERATOR, etc.)
    const minRequiredLevel = Math.min(...requiredRoles.map(getRoleLevel));

    if (userLevel < minRequiredLevel) {
      throw new ForbiddenException(
        `Acesso negado: requer ${requiredRoles.join(" ou ")}, mas você é ${user.role}`
      );
    }

    return true;
  }
}
