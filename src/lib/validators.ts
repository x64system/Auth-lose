import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().min(1),
  password: z.string().min(4)
});

export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  version: z.string().min(1),
  category: z.string().min(1),
  status: z.enum(["active", "inactive", "beta"]),
  imageUrl: z.string().url().optional(),
  price: z.number().nonnegative().optional()
});

export const licenseSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["trial", "1d", "7d", "30d", "90d", "180d", "365d", "lifetime"]),
  userId: z.string().optional(),
  device: z.string().optional(),
  notes: z.string().optional()
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "DEVELOPER", "CUSTOMER", "USER"]).optional(),
  isBanned: z.boolean().optional(),
  locale: z.string().optional(),
  theme: z.string().optional()
});
