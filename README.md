# Inject Bypass

Secure Licensing Platform.

Aplicação web full-stack para autenticação, gestão de licenças e administração de produtos/software.

## Stack

- Next.js (App Router) + TypeScript + Tailwind + Framer Motion
- Prisma + PostgreSQL
- JWT + Cookie HttpOnly + bcrypt
- API REST documentada em `docs/api.md`
- Estrutura preparada para Redis cache, S3 storage e integrações de pagamento

## Como executar

1. Copie `.env.example` para `.env`
2. Defina um `JWT_SECRET` forte (mínimo 16 caracteres aleatórios — ex.: `openssl rand -hex 32`). **A aplicação recusa-se a arrancar em produção sem isto.**
3. Instale dependências:
   - `npm install`
4. Gere o cliente Prisma:
   - `npm run prisma:generate`
5. Rode migrações:
   - `npm run prisma:migrate`
6. Popule dados demo:
   - `npm run prisma:seed`
7. Inicie:
   - `npm run dev`
8. (Opcional) Corra os testes automatizados:
   - `npm run test`

## Credenciais demo

- Email: `admin@injectbypass.io`
- Password: `Admin@123456`
- Cargo: `SUPER_ADMIN`

## Segurança

Esta secção documenta o modelo de segurança atual — é o que garante que a
plataforma pode ser exposta publicamente com confiança.

### Autenticação e sessão

- Password hashing com `bcrypt` (custo 12).
- Sessão via JWT assinado (`jose`) num cookie `HttpOnly` + `SameSite=Lax` + `Secure` (produção).
- Cada sessão tem um registo correspondente na tabela `Session` — isto permite **revogação real**: logout, ban ou troca de cargo invalidam a sessão imediatamente, mesmo que o JWT ainda não tenha expirado.
- 2FA (TOTP) end-to-end: se ativo, o login exige um código de 6 dígitos num segundo passo antes de qualquer sessão ser emitida (fluxo `POST /api/auth/login` → `requires2FA` → `POST /api/auth/2fa/login`).
- `JWT_SECRET` é obrigatório em produção — não existe fallback hardcoded no código-fonte (que é público).

### Controlo de acesso (RBAC)

Hierarquia de cargos (cada nível herda as permissões dos anteriores):

```
USER < CUSTOMER < SUPPORT < DEVELOPER < MODERATOR < ADMIN < SUPER_ADMIN
```

Todas as rotas administrativas (`/api/users`, `/api/licenses`, `/api/products`,
`/api/logs`, `/api/notifications`, `/api/stats`, `/api/analytics`,
`/api/payments`, `/api/orders`, `/api/keys`) exigem sessão válida e cargo
mínimo via `requireSession()` / `requireRole()` (`src/lib/security/guards.ts`).
`/api/licenses/validate` é a única exceção deliberada — é chamada pelo
software distribuído ao cliente final, não por um utilizador logado.
`/api/keys` é o único recurso "híbrido": cada utilizador gere as suas
próprias keys (`requireSession()` + verificação de dono), e staff
(`MODERATOR+`) vê/gere as de todos.

Ninguém pode atribuir ou editar um cargo superior ao seu próprio (impede
escalada de privilégios), e nenhum admin pode eliminar a sua própria conta
por engano.

### CSRF

Padrão *double-submit cookie*: o `middleware.ts` garante um cookie
`csrf_token` legível por JS em todo o browser; o cliente reenvia esse valor
no header `x-csrf-token` em cada mutação (via `src/lib/http-client.ts`); o
servidor compara os dois. Um site atacante não consegue ler o cookie da
vítima, por isso não consegue forjar o header correto.

### Rate limiting

Limite em memória por IP/utilizador nos endpoints sensíveis (login,
registo, forgot-password, 2FA, validação de licença). **Nota:** é por
processo — em produção com múltiplas instâncias, recomenda-se substituir
por um store partilhado (Redis/Upstash).

## Funcionalidades implementadas

- Landing Dark Premium responsiva (hero, estatísticas, features, planos, FAQ, testemunhos)
- Auth completo: register, login (com 2FA opcional), logout, remember me, forgot password
- Dashboard com sidebar SaaS (com estado ativo), topbar, KPIs reais, gráficos e módulos administrativos
- Módulos com dados reais: products, licenses, users, logs, notifications, analytics, stats, orders/payments, API keys
- Perfil próprio (`/api/users/me`) com edição de nome/idioma/tema e setup de 2FA com QR code
- API para auth, licenças, produtos, utilizadores, logs, notificações, analytics, payments, orders e API keys — todas protegidas por sessão + RBAC
- Endpoint OpenAPI JSON em `/api/docs` (base Swagger)
- Segurança: bcrypt, validação de input (zod), cookie HttpOnly, rate limit, CSRF real (double-submit cookie), sessões revogáveis em BD, cabeçalhos HTTP de segurança (`next.config.mjs`)
- Prisma schema expandido para roles, permissions, orders, payments, subscriptions, coupons, settings e api_keys
- Testes automatizados (Jest) para a lógica de segurança (RBAC, CSRF, validação)

## Experiência "premium"

- **Tema claro/escuro** persistente (localStorage + sincronizado com o perfil do utilizador), sem flash no carregamento — `src/components/theme-provider.tsx`.
- **Toasts** (`sonner`) para feedback de todas as ações administrativas, substituindo `alert()`/mensagens estáticas.
- **Diálogo de confirmação** consistente (`src/components/confirm-dialog.tsx`) para ações destrutivas, substituindo `window.confirm()`.
- **Command Palette** (`⌘K` / `Ctrl+K`) com navegação rápida e pesquisa em tempo real de utilizadores/licenças/produtos — `src/components/command-palette.tsx`.
- **Tabela de dados reutilizável** com ordenação, paginação e skeleton de loading — `src/components/data-table.tsx` — usada em Users, Licenses, Products, Logs, Orders e API Keys.
- **Animações** de entrada em cards, linhas de tabela e transições de página via `framer-motion`.

## Nota de arquitetura backend

A camada API em NestJS (`apps/api`, porta `4000`) está funcional e partilha o mesmo schema Prisma.
O frontend Next.js (porta `3000`) mantém as rotas `src/app/api/*` para server-side rendering e cookies de sessão.

> **Recomendação:** ter duas implementações de auth/RBAC em paralelo (Next.js
> Route Handlers + NestJS) foi a causa raiz da maior parte das falhas de
> segurança encontradas nesta revisão — os guards foram implementados corretamente
> num lado e esquecidos no outro. A prazo, vale a pena consolidar num único
> backend (ver secção "Sugestões" mais abaixo).

## Como executar (monorepo)

```bash
# 1. Configurar ambiente
cp .env.example .env          # e apps/api/.env (ver abaixo) — define JWT_SECRET igual nos dois

# 2. Frontend (Next.js)
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev                   # http://localhost:3000

# 3. API (NestJS) — terminal separado
cd apps/api
npm install
npm run prisma:generate
npm run start:dev            # http://localhost:4000/docs (Swagger)
```

Ou, com Docker:

```bash
docker compose up --build
```

## Endpoints da API NestJS (`apps/api`)

- `POST /auth/register`
- `POST /auth/login` (define cookie `inject_bypass_session`)
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me` (protegido por `JwtAuthGuard`)
- `GET/PUT/DELETE /users` (protegido por `JwtAuthGuard` + `RolesGuard`)
- `GET /products`, `GET /licenses` (protegidos por `JwtAuthGuard` + `RolesGuard`; ver Swagger em `/docs`)

## Fase 2 implementada

- CRUD real com filtros para `products`, `licenses` e `users` (incluindo rotas `PUT`/`DELETE` por id)
- 2FA TOTP completo, incluindo aplicação obrigatória no login:
  - `POST /api/auth/2fa/setup`
  - `POST /api/auth/2fa/verify` (ativa 2FA na conta)
  - `POST /api/auth/2fa/login` (passo 2 do login quando 2FA está ativo)
- Página de documentação em `/docs` consumindo OpenAPI de `/api/docs`
- Bootstrap NestJS em `apps/api` com Swagger nativo (`/docs` na porta 4000)
- `apps/api` agora inclui PrismaService e controllers/services reais para `products`, `licenses`, `users` e `auth`
- Página de perfil com dados reais, setup/verify de 2FA e QR code
- Dashboard com ações de edição em Products/Users e enable-disable-renew em Licenses, todas com feedback de erro real

## Fase 3 — hardening de segurança (auditoria completa)

- Controlo de acesso (RBAC) aplicado a **todas** as rotas administrativas (antes, praticamente nenhuma verificava sessão)
- Correção de vazamento de `passwordHash`/`twoFactorSecret` via `include: { user: true }` no Prisma (Next.js e NestJS)
- 2FA passou a ser exigido no login (antes era possível ativá-lo e continuar a entrar sem código)
- Remoção do segredo JWT hardcoded (`inject-bypass-secret`) — obrigatório via variável de ambiente em produção
- Sessões agora revogáveis via tabela `Session` (logout/ban/refresh invalidam de imediato)
- CSRF real via double-submit cookie (antes era só um header sem validação)
- Prevenção de escalada de privilégios na edição de utilizadores (ninguém atribui um cargo superior ao seu)
- Notificações deixaram de expor os dados de todos os utilizadores a qualquer pessoa autenticada
- Middleware de proteção de rotas `/dashboard/**` no servidor (antes era só um hook client-side)
- Cabeçalhos HTTP de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS)
- Seed corrigido para corresponder às credenciais documentadas neste README

## Fase 4 — "premium" (UX, módulos em falta, testes)

- Tema claro/escuro real (`ThemeProvider`, sem flash, sincronizado com `/api/users/me`)
- Sistema de toasts (`sonner`) e diálogo de confirmação substituindo `alert()`/`confirm()` nativos
- Command Palette (`⌘K`) com pesquisa em tempo real
- Componente `DataTable` reutilizável (ordenação + paginação + skeleton) aplicado a Users/Licenses/Products/Logs/Orders/API Keys
- Animações de entrada e transições de página (`framer-motion`)
- **Módulo Orders/Payments completo**: `GET/POST /api/orders`, `PUT/DELETE /api/orders/{id}` — marcar como paga gera automaticamente um `Payment` "completed" (mantém a receita em `/api/stats` consistente); reembolsar atualiza o pagamento associado. Seed com dados demo.
- **Módulo API Keys completo**: `GET/POST /api/keys`, `PUT/DELETE /api/keys/{id}` — o valor completo da key só é devolvido uma única vez na criação; qualquer listagem posterior devolve sempre uma versão mascarada.
- Testes automatizados (Jest) para `rbac.ts`, `validators.ts` e `csrf.ts` — corre com `npm run test`

## Sugestões para os próximos passos

1. **Consolidar backend**: escolher Next.js Route Handlers *ou* NestJS como única fonte de verdade para evitar drift de segurança entre os dois.
2. **Rate limiting partilhado** (Redis/Upstash) antes de correr múltiplas instâncias em produção.
3. **Observabilidade**: ligar os `Log` já gravados a um painel de auditoria filtrável (ação, utilizador, intervalo de datas) — já há dados reais suficientes para isto.
4. **Emails reais**: `forgot-password` e notificações estão prontos para um provider SMTP/Resend, mas ainda não enviam nada.
5. **Testes de rotas** (Route Handlers com Prisma mockado) para além dos testes de lógica pura já existentes.
6. **Atualizar Next.js**: a versão atual (14.2.x) tem CVEs conhecidas corrigidas em versões mais recentes (`npm audit`); vale a pena planear a migração para o Next.js 15.
