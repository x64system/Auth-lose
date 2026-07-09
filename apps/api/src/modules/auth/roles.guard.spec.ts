import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { AppRole } from "./roles.decorator";

function buildContext(userRole: string | undefined, handlerRoles: AppRole[] | undefined): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: userRole !== undefined ? { role: userRole } : undefined
      })
    })
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector]
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  // ─── Sem restrição ──────────────────────────────────────────────────────
  it("deve permitir qualquer utilizador quando não há roles definidas", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    expect(guard.canActivate(buildContext("USER", undefined))).toBe(true);
  });

  // ─── Cargo exacto ───────────────────────────────────────────────────────
  it("deve permitir acesso quando o utilizador tem exactamente o cargo exigido", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ADMIN"] as AppRole[]);
    expect(guard.canActivate(buildContext("ADMIN", ["ADMIN"]))).toBe(true);
  });

  // ─── Hierarquia: superior passa ─────────────────────────────────────────
  it("SUPER_ADMIN deve passar em rota de ADMIN", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ADMIN"] as AppRole[]);
    expect(guard.canActivate(buildContext("SUPER_ADMIN", ["ADMIN"]))).toBe(true);
  });

  it("ADMIN deve passar em rota de MODERATOR", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["MODERATOR"] as AppRole[]);
    expect(guard.canActivate(buildContext("ADMIN", ["MODERATOR"]))).toBe(true);
  });

  it("SUPER_ADMIN deve passar em rota de MODERATOR ou DEVELOPER", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["MODERATOR", "DEVELOPER"] as AppRole[]);
    expect(guard.canActivate(buildContext("SUPER_ADMIN", ["MODERATOR", "DEVELOPER"]))).toBe(true);
  });

  // ─── Hierarquia: inferior falha ─────────────────────────────────────────
  it("USER deve ser negado em rota de ADMIN", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ADMIN"] as AppRole[]);
    expect(() => guard.canActivate(buildContext("USER", ["ADMIN"]))).toThrow(ForbiddenException);
  });

  it("CUSTOMER deve ser negado em rota de SUPER_ADMIN", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["SUPER_ADMIN"] as AppRole[]);
    expect(() => guard.canActivate(buildContext("CUSTOMER", ["SUPER_ADMIN"]))).toThrow(ForbiddenException);
  });

  it("MODERATOR deve ser negado em rota exclusiva de ADMIN", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ADMIN", "SUPER_ADMIN"] as AppRole[]);
    expect(() => guard.canActivate(buildContext("MODERATOR", ["ADMIN", "SUPER_ADMIN"]))).toThrow(ForbiddenException);
  });

  // ─── Sem cargo no token ─────────────────────────────────────────────────
  it("deve lançar ForbiddenException quando user não está no token", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ADMIN"] as AppRole[]);
    expect(() => guard.canActivate(buildContext(undefined, ["ADMIN"]))).toThrow(ForbiddenException);
  });
});
