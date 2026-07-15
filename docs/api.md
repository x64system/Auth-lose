# Inject Bypass REST API

Base URL: `/api`

Salvo indicação contrária, todos os endpoints exigem uma sessão válida
(cookie `inject_bypass_session`, definido pelo login) e o cargo mínimo
indicado. Mutações (`POST`/`PUT`/`PATCH`/`DELETE`) exigem também o header
`x-csrf-token` com o valor do cookie `csrf_token` (ver "CSRF" no README).

Hierarquia de cargos: `USER < CUSTOMER < SUPPORT < DEVELOPER < MODERATOR < ADMIN < SUPER_ADMIN`.

## Auth

- `POST /auth/register` — Cria utilizador. Público.
- `POST /auth/login` — Login com cookie HttpOnly. Público. Se a conta tiver
  2FA ativo, devolve `{ requires2FA: true, pendingToken }` em vez de criar
  sessão — completar em `POST /auth/2fa/login`.
- `POST /auth/2fa/login` — Passo 2 do login com `{ pendingToken, totpToken }`. Público.
- `POST /auth/logout` — Termina a sessão atual (remove o registo em `Session`). Requer sessão.
- `POST /auth/refresh` — Renova a sessão atual. Requer sessão.
- `POST /auth/2fa/setup` — Gera segredo TOTP + QR code para a conta autenticada. Requer sessão.
- `POST /auth/2fa/verify` — Confirma o código TOTP e ativa 2FA na conta. Requer sessão.
- `POST /auth/forgot-password` — Pedido de recuperação (não revela se o email existe). Público.

## Utilizadores

- `GET /users` — Lista utilizadores. Requer `ADMIN`.
- `PUT /users/{id}` — Atualiza nome/cargo/estado. Requer `ADMIN`. Não é possível atribuir/editar um cargo superior ao do chamador.
- `DELETE /users/{id}` — Elimina utilizador. Requer `ADMIN`. Não é possível eliminar a própria conta.
- `GET /users/me` — Perfil da conta autenticada. Requer sessão.
- `PATCH /users/me` — Atualiza nome/idioma/tema da própria conta (nunca cargo/estado). Requer sessão.

## Licenças

- `GET /licenses` — Lista licenças. Requer `SUPPORT`.
- `POST /licenses` — Cria licença. Requer `MODERATOR`.
- `PUT /licenses/{id}` — Atualiza estado/expiração. Requer `MODERATOR`.
- `DELETE /licenses/{id}` — Elimina licença. Requer `MODERATOR`.
- `POST /licenses/validate` — Valida e ativa licença. **Público** (chamado pelo software distribuído ao cliente final), com rate limit por IP. Nunca devolve dados sensíveis do utilizador associado.

Exemplo payload `POST /licenses/validate`:

```json
{
  "code": "INJ-ABC123",
  "device": "HWID-001"
}
```

## Produtos

- `GET /products` — Requer `SUPPORT`.
- `POST /products` — Requer `DEVELOPER`.
- `PUT /products/{id}` — Requer `DEVELOPER`.
- `DELETE /products/{id}` — Requer `DEVELOPER`.

## Estatísticas

- `GET /stats` — Requer `SUPPORT`.

## Logs

- `GET /logs` — Requer `ADMIN` (contém trilha de auditoria completa).

## Notifications

- `GET /notifications` — Requer sessão. Utilizadores `< MODERATOR` só veem as suas próprias notificações; staff (`MODERATOR+`) vê todas.

## Analytics

- `GET /analytics` — Requer `SUPPORT`.

## Payments

- `GET /payments` — Requer `SUPPORT`.

## Orders

- `GET /orders` — Lista encomendas (com produto, cliente e pagamentos). Requer `SUPPORT`. Suporta `?q=` (cliente/produto) e `?status=`.
- `POST /orders` — Cria uma encomenda manual. Requer `MODERATOR`.
- `PUT /orders/{id}` — Atualiza o estado (`pending`/`paid`/`cancelled`/`refunded`). Requer `MODERATOR`. Marcar como `paid` cria automaticamente um `Payment` `completed` associado (se ainda não existir); marcar como `refunded` atualiza o pagamento existente.
- `DELETE /orders/{id}` — Elimina a encomenda. Requer `ADMIN`.

## API Keys

- `GET /keys` — Lista as próprias keys (mascaradas); staff (`MODERATOR+`) vê as de todos. Requer sessão.
- `POST /keys` — Cria uma nova key para a própria conta. Requer sessão. **A única resposta de toda a API que devolve o valor completo da key** — guarda-o imediatamente, não é recuperável depois.
- `PUT /keys/{id}` — Revoga (`{ revoked: true }`). Só o dono ou `MODERATOR+`.
- `DELETE /keys/{id}` — Elimina. Só o dono ou `ADMIN+`.

## Swagger/OpenAPI

- `GET /docs` retorna OpenAPI JSON para integração com Swagger UI. Público.
