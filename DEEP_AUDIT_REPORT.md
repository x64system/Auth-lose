# 🔍 Relatório de Auditoria Profunda - Inject Bypass

**Data:** 2026-07-12  
**Tipo:** Análise de Segurança e Bugs Completa  
**Status:** Em andamento

---

## 📊 Resumo Executivo

### Análise Realizada:
- ✅ Todos os 18 route handlers da API
- ✅ Guards de segurança e middleware
- ✅ Hooks do React
- ✅ Schemas de validação
- ✅ Lógica de autenticação e autorização
- ✅ NestJS services e controllers

### Bugs Anteriormente Corrigidos (11):
1. ✅ Exposição de password hash no NestJS
2. ✅ Race condition no 2FA setup
3. ✅ JWT Guard não validava sessão no banco
4. ✅ Lógica incorreta de session refresh
5. ✅ Validação HWID ausente em licenças
6. ✅ Rate limiting ausente no 2FA login por usuário
7. ✅ Bug de data em calculateExpiration
8. ✅ Array access sem verificação de length
9. ✅ JwtAuthGuard não registrado nos módulos
10. ✅ Frontend 2FA não enviava secret
11. ✅ Loop infinito no useTokenRefresh

---

## 🐛 NOVOS BUGS ENCONTRADOS

### 🔴 CRÍTICOS (Severidade Alta)

#### BUG #12: Register sem rate limit por email
**Arquivo:** `src/app/api/auth/register/route.ts:8`  
**Severidade:** 🔴 CRÍTICA  
**Descrição:** O rate limit está apenas por IP, permitindo que um atacante crie múltiplas contas do mesmo IP mudando apenas o email.  
**Impacto:** Spam de contas, abuse do sistema  
**Correção:** Adicionar rate limit também por email

```typescript
// ANTES
const limited = rateLimit(`register:${ip}`, 8, 60_000);

// DEPOIS
const ipLimited = rateLimit(`register:${ip}`, 8, 60_000);
if (ipLimited) return ipLimited;
const emailLimited = rateLimit(`register:${parsed.data.email}`, 3, 60_000);
if (emailLimited) return emailLimited;
```

---

#### BUG #13: Login sem rate limit por email/usuário
**Arquivo:** `src/app/api/auth/login/route.ts:9`  
**Severidade:** 🔴 CRÍTICA  
**Descrição:** Rate limit apenas por IP permite brute force distribuído em um email específico.  
**Impacto:** Ataques de credential stuffing distribuídos  
**Correção:** Adicionar rate limit por email

```typescript
// ANTES
const limited = rateLimit(`login:${ip}`, 10, 60_000);

// DEPOIS
const ipLimited = rateLimit(`login:${ip}`, 10, 60_000);
if (ipLimited) return ipLimited;
const emailLimited = rateLimit(`login:${parsed.data.email}`, 5, 60_000);
if (emailLimited) return emailLimited;
```

---

#### BUG #14: Logout sem CSRF protection
**Arquivo:** `src/app/api/auth/logout/route.ts`  
**Severidade:** 🔴 CRÍTICA  
**Descrição:** O endpoint de logout não valida CSRF, permitindo que um atacante force logout de vítimas.  
**Impacto:** CSRF attack para forçar logout  
**Correção:** Adicionar validateCsrf()

```typescript
// ADICIONAR
const csrfError = validateCsrf(req);
if (csrfError) return csrfError;
```

---

#### BUG #15: Falta validação de tipo do campo `total` em orders
**Arquivo:** `src/app/api/orders/[id]/route.ts:33,47`  
**Severidade:** 🔴 CRÍTICA  
**Descrição:** O campo `total` do Order pode ser manipulado para valores negativos ou NaN no SQLite (Float).  
**Impacto:** Manipulação de valores financeiros, corrupção de dados  
**Correção:** Validar que total > 0 antes de criar Payment

```typescript
// ADICIONAR antes de criar Payment
if (typeof existing.total !== 'number' || existing.total <= 0 || !isFinite(existing.total)) {
  return NextResponse.json({ error: "Total inválido" }, { status: 400 });
}
```

---

### 🟠 ALTOS (Severidade Média-Alta)

#### BUG #16: License update permite expiresAt no passado
**Arquivo:** `src/app/api/licenses/[id]/route.ts:16`  
**Severidade:** 🟠 ALTA  
**Descrição:** Não há validação se `expiresAt` está no futuro, permitindo criar licenças já expiradas.  
**Impacto:** Dados inconsistentes, licenças inválidas  
**Correção:** Validar data

```typescript
if (body?.expiresAt) {
  const expiresDate = new Date(body.expiresAt);
  if (isNaN(expiresDate.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }
  // Permitir passado apenas para status EXPIRED
  if (expiresDate < new Date() && body?.status !== "EXPIRED") {
    return NextResponse.json({ error: "Data de expiração deve ser no futuro" }, { status: 400 });
  }
}
```

---

#### BUG #17: Product schema permite price negativo
**Arquivo:** `src/lib/validators.ts:36`  
**Severidade:** 🟠 ALTA  
**Descrição:** `nonnegative()` permite 0, mas não há validação de máximo ou sanitização.  
**Impacto:** Preços absurdos ou zero podem ser criados  
**Correção:** Adicionar validação de range

```typescript
// ANTES
price: z.number().nonnegative().optional()

// DEPOIS
price: z.number().min(0).max(999999.99).optional()
```

---

#### BUG #18: Falta paginação nos endpoints GET
**Arquivos:** `src/app/api/logs/route.ts`, `src/app/api/users/route.ts`, etc  
**Severidade:** 🟠 ALTA  
**Descrição:** Endpoints retornam TODOS os registros sem paginação (logs limited to 100, mas sem skip).  
**Impacto:** Performance degradada com muitos dados, possível DoS  
**Correção:** Implementar paginação com limit/offset

```typescript
const page = parseInt(searchParams.get("page") || "1");
const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  db.model.findMany({ skip, take: limit, ...otherParams }),
  db.model.count({ where: ... })
]);

return NextResponse.json({ data, total, page, pages: Math.ceil(total / limit) });
```

---

#### BUG #19: SQLite não suporta transações complexas corretamente
**Arquivo:** `src/app/api/orders/[id]/route.ts:28-44`  
**Severidade:** 🟠 ALTA  
**Descrição:** Múltiplas operações sem transação podem deixar dados inconsistentes.  
**Impacto:** Race condition se múltiplos admins atualizarem o mesmo pedido  
**Correção:** Usar transação Prisma

```typescript
await db.$transaction(async (tx) => {
  await tx.order.update({ where: { id: params.id }, data: { status: body.status } });
  
  if (body.status === "paid") {
    const hasCompleted = existing.payments.some((p) => p.status === "completed");
    if (!hasCompleted) {
      await tx.payment.create({...});
    }
  }
});
```

---

### 🟡 MÉDIOS (Severidade Média)

#### BUG #20: Falta validação de formato de email no login
**Arquivo:** `src/app/api/auth/login/route.ts:18`  
**Severidade:** 🟡 MÉDIA  
**Descrição:** Aceita qualquer string como email, fazendo query desnecessária no banco.  
**Impacto:** Queries inúteis, possível DoS com emails absurdos  
**Correção:** Validar formato antes de query

```typescript
const parsed = loginSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: "Invalid input" }, { status: 400 });
}

// loginSchema já valida email, mas adicionar validação extra
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(parsed.data.email)) {
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
```

---

#### BUG #21: Logs sem cleanup automático
**Arquivo:** `src/app/api/logs/route.ts`  
**Severidade:** 🟡 MÉDIA  
**Descrição:** Tabela `Log` cresce indefinidamente sem limpeza.  
**Impacto:** Banco de dados pode crescer muito, degradando performance  
**Correção:** Implementar job de limpeza ou TTL

```typescript
// Criar endpoint admin para limpar logs antigos
// ou implementar no seed/cron
await db.log.deleteMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 dias
    }
  }
});
```

---

#### BUG #22: Falta índice em campos frequentemente pesquisados
**Arquivo:** `prisma/schema.prisma`  
**Severidade:** 🟡 MÉDIA  
**Descrição:** Campos como `email`, `code`, `token` não têm `@@index` explícito (apenas `@unique`).  
**Impacto:** Queries lentas com muitos dados  
**Correção:** Adicionar índices para otimização

```prisma
model Log {
  // ...
  @@index([userId])
  @@index([createdAt])
  @@index([action])
}

model License {
  // ...
  @@index([status])
  @@index([userId])
  @@index([productId])
}
```

---

#### BUG #23: Erro handling genérico sem logs
**Arquivos:** Vários  
**Severidade:** 🟡 MÉDIA  
**Descrição:** `catch(() => null)` esconde erros sem logging.  
**Impacto:** Dificuldade de debug em produção  
**Correção:** Adicionar logging apropriado

```typescript
// ANTES
const body = await req.json().catch(() => null);

// DEPOIS
const body = await req.json().catch((err) => {
  console.error('[API] JSON parse error:', err);
  return null;
});
```

---

### 🔵 BAIXOS (Severidade Baixa)

#### BUG #24: CSRF cookie sem secure flag em desenvolvimento
**Arquivo:** `src/middleware.ts:55`  
**Severidade:** 🔵 BAIXA  
**Descrição:** Cookie CSRF não é secure em dev, mas isso é esperado.  
**Impacto:** Nenhum (comportamento correto)  
**Ação:** Documentar apenas

---

#### BUG #25: Console.warn em produção
**Arquivo:** `src/lib/hooks/use-token-refresh.ts:35,42`  
**Severidade:** 🔵 BAIXA  
**Descrição:** Console.warn deve ser removido em produção.  
**Impacto:** Logs desnecessários  
**Correção:** Usar logger condicional

```typescript
if (process.env.NODE_ENV === 'development') {
  console.warn('[Token Refresh] Failed');
}
```

---

## 📊 Estatísticas Finais

### Por Severidade:
- 🔴 **Críticos:** 4 bugs novos
- 🟠 **Altos:** 4 bugs novos
- 🟡 **Médios:** 4 bugs novos
- 🔵 **Baixos:** 2 bugs novos

**Total de bugs novos encontrados:** 14  
**Total de bugs corrigidos anteriormente:** 11  
**Total geral:** 25 bugs identificados

---

## ✅ Pontos Positivos Encontrados

1. ✅ Validação Zod em todos os endpoints críticos
2. ✅ CSRF protection implementado corretamente
3. ✅ RBAC bem implementado com hierarquia
4. ✅ Password hashing seguro (bcrypt custo 12)
5. ✅ JWT com sessões revogáveis no banco
6. ✅ Select explícito para prevenir data leaks
7. ✅ Rate limiting nos endpoints sensíveis
8. ✅ 2FA implementado corretamente
9. ✅ Logs de auditoria em todas ações administrativas
10. ✅ Proteção contra IDOR em API keys

---

## 🎯 Próximos Passos

### Prioridade CRÍTICA (Fazer Agora):
1. Corrigir Bug #12 - Rate limit por email no register
2. Corrigir Bug #13 - Rate limit por email no login  
3. Corrigir Bug #14 - CSRF no logout
4. Corrigir Bug #15 - Validação de valores financeiros

### Prioridade ALTA (Esta Semana):
5. Corrigir Bug #16 - Validação de datas
6. Corrigir Bug #17 - Validação de preços
7. Corrigir Bug #18 - Implementar paginação
8. Corrigir Bug #19 - Usar transações

### Prioridade MÉDIA (Este Mês):
9. Corrigir Bug #20 - Validação de email
10. Corrigir Bug #21 - Cleanup de logs
11. Corrigir Bug #22 - Adicionar índices
12. Corrigir Bug #23 - Melhorar error handling

### Prioridade BAIXA (Quando Possível):
13. Corrigir Bug #24 - Documentar comportamento
14. Corrigir Bug #25 - Remover console.warn

---

## 🔒 Recomendações Gerais de Segurança

1. **Migrar para PostgreSQL em produção** - SQLite não é ideal para múltiplos acessos
2. **Implementar Redis para rate limiting** - Rate limit em memória não funciona com múltiplas instâncias
3. **Adicionar honeypot no register** - Prevenir bots
4. **Implementar CAPTCHA** - Nos forms de register/login após muitas tentativas
5. **Adicionar WAF** - Web Application Firewall (Cloudflare, AWS WAF)
6. **Implementar monitoring** - Sentry, DataDog, New Relic
7. **Adicionar health checks** - Para monitorar uptime
8. **Configurar backup automático** - Do banco de dados
9. **Implementar feature flags** - Para rollback rápido
10. **Adicionar testes de integração** - Além dos unit tests

---

**Status:** ✅ AUDITORIA COMPLETA  
**Próxima ação:** Começar correções dos bugs críticos
