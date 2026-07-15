import {
  registerSchema,
  loginSchema,
  userUpdateSchema,
  selfProfileUpdateSchema,
  orderSchema,
  apiKeySchema
} from "./validators";

describe("registerSchema", () => {
  it("rejeita passwords fracas (sem maiúscula/número, ou demasiado curtas)", () => {
    expect(registerSchema.safeParse({ name: "Ana Silva", email: "ana@example.com", password: "abc" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Ana Silva", email: "ana@example.com", password: "abcdefgh" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Ana Silva", email: "ana@example.com", password: "abcdefgH" }).success).toBe(false);
  });

  it("aceita uma password forte", () => {
    const result = registerSchema.safeParse({ name: "Ana Silva", email: "ana@example.com", password: "Abcdefg1" });
    expect(result.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    expect(registerSchema.safeParse({ name: "Ana Silva", email: "nao-e-um-email", password: "Abcdefg1" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("aceita totpToken opcional de 6 dígitos", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x", totpToken: "123456" }).success).toBe(true);
  });

  it("rejeita totpToken com tamanho errado", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x", totpToken: "123" }).success).toBe(false);
  });

  it("funciona sem totpToken (login sem 2FA)", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
});

describe("userUpdateSchema", () => {
  it("aceita apenas os cargos válidos", () => {
    expect(userUpdateSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
    expect(userUpdateSchema.safeParse({ role: "SUPER_HACKER" }).success).toBe(false);
  });
});

describe("selfProfileUpdateSchema", () => {
  it("nunca aceita role ou isBanned (protege contra auto-escalada)", () => {
    const parsed = selfProfileUpdateSchema.safeParse({ name: "Novo Nome", role: "SUPER_ADMIN", isBanned: false });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("role");
      expect(parsed.data).not.toHaveProperty("isBanned");
    }
  });
});

describe("orderSchema", () => {
  it("exige userId e productId", () => {
    expect(orderSchema.safeParse({ userId: "u1", productId: "p1" }).success).toBe(true);
    expect(orderSchema.safeParse({ productId: "p1" }).success).toBe(false);
  });

  it("rejeita total negativo", () => {
    expect(orderSchema.safeParse({ userId: "u1", productId: "p1", total: -5 }).success).toBe(false);
  });
});

describe("apiKeySchema", () => {
  it("exige um nome com pelo menos 2 caracteres", () => {
    expect(apiKeySchema.safeParse({ name: "CI" }).success).toBe(true);
    expect(apiKeySchema.safeParse({ name: "a" }).success).toBe(false);
    expect(apiKeySchema.safeParse({}).success).toBe(false);
  });
});
