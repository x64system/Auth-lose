/**
 * Resolução centralizada do segredo JWT usado pelo backend NestJS.
 *
 * Sem fallback hardcoded em produção: um segredo previsível no código
 * público equivale a uma porta dos fundos (qualquer pessoa forjaria
 * tokens com qualquer role). Em desenvolvimento, gera um aviso e usa um
 * segredo efémero apenas para não bloquear o arranque local.
 */
export function resolveJwtSecret(): string {
  const rawSecret = process.env.JWT_SECRET;
  const isValid = !!rawSecret && rawSecret.length >= 16;

  if (!isValid) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET ausente ou demasiado curto (mínimo 16 caracteres). Define-o nas variáveis de ambiente antes de arrancar em produção."
      );
    }
    // eslint-disable-next-line no-console
    console.warn(
      "[auth] JWT_SECRET não definido — a usar um segredo de desenvolvimento efémero. Define JWT_SECRET no .env antes de ir para produção."
    );
  }

  return isValid ? (rawSecret as string) : "dev-only-insecure-secret-do-not-ship";
}
