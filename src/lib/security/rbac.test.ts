import { ROLE_HIERARCHY, roleLevel, roleAtLeast } from "./rbac";

describe("ROLE_HIERARCHY", () => {
  it("tem os 7 cargos na ordem crescente de permissões", () => {
    expect(ROLE_HIERARCHY).toEqual(["USER", "CUSTOMER", "SUPPORT", "DEVELOPER", "MODERATOR", "ADMIN", "SUPER_ADMIN"]);
  });
});

describe("roleLevel", () => {
  it("devolve um índice crescente conforme a hierarquia", () => {
    expect(roleLevel("USER")).toBe(0);
    expect(roleLevel("SUPER_ADMIN")).toBe(6);
    expect(roleLevel("ADMIN")).toBeGreaterThan(roleLevel("MODERATOR"));
  });

  it("devolve -1 para um cargo desconhecido", () => {
    expect(roleLevel("NOT_A_ROLE")).toBe(-1);
  });
});

describe("roleAtLeast", () => {
  it("permite um cargo igual ao mínimo exigido", () => {
    expect(roleAtLeast("ADMIN", "ADMIN")).toBe(true);
  });

  it("permite um cargo superior ao mínimo exigido", () => {
    expect(roleAtLeast("SUPER_ADMIN", "MODERATOR")).toBe(true);
  });

  it("nega um cargo inferior ao mínimo exigido", () => {
    expect(roleAtLeast("USER", "SUPPORT")).toBe(false);
  });

  it("nega um cargo desconhecido (nunca deve dar acesso por omissão)", () => {
    expect(roleAtLeast("QUALQUER_COISA", "USER")).toBe(false);
  });
});
