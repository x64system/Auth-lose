# Inject Bypass

Secure Licensing Platform.

Aplicação web full-stack para autenticação, gestão de licenças e administração de produtos/software.

## Stack

- Next.js (App Router) + TypeScript + Tailwind + Framer Motion
- Prisma + PostgreSQL
- JWT + Cookie HttpOnly + Argon2
- API REST documentada em `docs/api.md`
- Estrutura preparada para Redis cache, S3 storage e integrações de pagamento

## Como executar

1. Copie `.env.example` para `.env`
2. Instale dependências:
   - `npm install`
3. Gere o cliente Prisma:
   - `npm run prisma:generate`
4. Rode migrações:
   - `npm run prisma:migrate`
5. Popule dados demo:
   - `npm run prisma:seed`
6. Inicie:
   - `npm run dev`

## Credenciais demo

- Email: `admin@injectbypass.io`
- Password: `Admin@123456`

## Funcionalidades implementadas

- Landing Dark Premium responsiva (hero, estatísticas, features, planos, FAQ, testemunhos)
- Auth (register, login, logout, remember me, forgot password UI)
- Dashboard com sidebar SaaS, topbar, KPIs, gráficos e módulos administrativos
- Módulos: products, licenses, users, orders, analytics, logs, notifications, API, settings, profile
- API para auth, licenças, produtos, utilizadores, logs, notificações, analytics e payments
- Endpoint OpenAPI JSON em `/api/docs` (base Swagger)
- Segurança com Argon2, validação de input, cookie HttpOnly, rate limit e CSRF token header
- Prisma schema expandido para roles, permissions, orders, payments, subscriptions, coupons, settings e api_keys

## Nota de arquitetura backend

A camada API em NestJS (`apps/api`, porta `4000`) está funcional e partilha o mesmo schema Prisma.  
O frontend Next.js (porta `3000`) mantém as rotas `src/app/api/*` para server-side rendering e cookies de sessão.

## Como executar (monorepo)

```bash
# 1. Configurar ambiente
cp .env.example .env          # e apps/api/.env (ver abaixo)

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
- `GET/PUT/DELETE /users` (protegido por `RolesGuard`)
- `GET /products`, `GET /licenses` (ver Swagger em `/docs`)

## Funcionalidades implementadas

- Landing Dark Premium responsiva (hero, estatísticas, features, planos, FAQ, testemunhos)
- Auth (register, login, logout, remember me, forgot password UI + rota de recuperação)
- Dashboard com sidebar SaaS, topbar, KPIs, gráficos e módulos administrativos
- Módulos: products, licenses, users, orders, analytics, logs, notifications, API, settings, profile
- API Next.js para auth, licenças, produtos, utilizadores, logs, notificações, analytics e payments
- API NestJS com auth completo, guards (`JwtAuthGuard`, `RolesGuard`), Swagger e testes (Jest)
- Endpoint OpenAPI JSON em `/api/docs` (base Swagger)
- Segurança com Argon2, validação de input, cookie HttpOnly, rate limit e CSRF token header
- Prisma schema expandido para roles, permissions, orders, payments, subscriptions, coupons, settings e api_keys

## Fase 2 implementada

- CRUD real com filtros para `products`, `licenses` e `users` (incluindo rotas `PUT`/`DELETE` por id)
- Base de 2FA TOTP com endpoints:
  - `POST /api/auth/2fa/setup`
  - `POST /api/auth/2fa/verify`
- Página de documentação em `/docs` consumindo OpenAPI de `/api/docs`
- Bootstrap NestJS em `apps/api` com Swagger nativo (`/docs` na porta 4000)
- `apps/api` agora inclui PrismaService e controllers/services reais para `products`, `licenses`, `users` e `auth`
- Página de perfil com setup/verify de 2FA e QR code
- Dashboard com ações de edição em Products/Users e enable-disable-renew em Licenses
