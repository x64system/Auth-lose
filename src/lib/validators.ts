import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome demasiado curto"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "A password deve ter pelo menos 8 caracteres")
    .regex(/[a-z]/, "A password deve conter uma letra minúscula")
    .regex(/[A-Z]/, "A password deve conter uma letra maiúscula")
    .regex(/[0-9]/, "A password deve conter um número")
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
  totpToken: z.string().trim().length(6).optional()
});

export const twoFactorLoginSchema = z.object({
  pendingToken: z.string().min(1),
  totpToken: z.string().trim().length(6)
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  version: z.string().min(1),
  category: z.string().min(1),
  status: z.enum(["active", "inactive", "beta"]),
  imageUrl: z.string().url().optional(),
  // BUG FIX #17: Adicionar validação de range para price
  price: z.number().min(0).max(999999.99).optional()
});

export const licenseSchema = z.object({
  productId: z.string().optional(),
  type: z.enum(["trial", "1d", "7d", "30d", "90d", "180d", "365d", "lifetime"]),
  userId: z.string().optional(),
  device: z.string().optional(),
  notes: z.string().optional()
});

export const orderSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  total: z.number().nonnegative().optional()
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "DEVELOPER", "CUSTOMER", "USER"]).optional(),
  isBanned: z.boolean().optional(),
  locale: z.string().optional(),
  theme: z.string().optional()
});

// Usado em /api/users/me — deliberadamente SEM `role`/`isBanned`, para que
// nenhum utilizador possa auto-promover-se editando o seu próprio perfil.
export const selfProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  locale: z.string().optional(),
  theme: z.string().optional()
});

// Usado em POST /api/keys - o utilizador so escolhe o nome; o valor da key
// em si e sempre gerado no servidor (nunca aceite a partir do cliente).
export const apiKeySchema = z.object({
  name: z.string().min(2, "Nome demasiado curto")
});
