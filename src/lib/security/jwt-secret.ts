/**
 * Resolução centralizada do segredo JWT. Isolado num módulo sem
 * dependências de Node.js (só `process.env` + `TextEncoder`) para poder
 * ser importado tanto por `@/lib/auth` (runtime Node, usado pelos Route
 * Handlers) como por `middleware.ts` (runtime Edge).
 *
 * Não existe fallback hardcoded em produção: um segredo previsível no
 * código-fonte público equivale a uma porta dos fundos, já que qualquer
 * pessoa consegue forjar tokens de sessão com qualquer role.
 */
export function resolveJwtSecretBytes(): Uint8Array {
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

  return new TextEncoder().encode(isValid ? rawSecret : "dev-only-insecure-secret-do-not-ship");
}
