import { SetMetadata } from "@nestjs/common";

export type AppRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MODERATOR"
  | "SUPPORT"
  | "DEVELOPER"
  | "CUSTOMER"
  | "USER";

export const ROLES_KEY = "roles";

/**
 * Decora um handler/controlador exigindo que o utilizador autenticado
 * tenha pelo menos um dos cargos listados.
 *
 * @example @Roles("ADMIN", "SUPER_ADMIN")
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
