# Inject Bypass REST API

Base URL: `/api`

## Auth

- `POST /auth/register` - Cria utilizador
- `POST /auth/login` - Login com cookie HttpOnly
- `POST /auth/logout` - Logout

## Licenças

- `GET /licenses` - Lista licenças
- `POST /licenses` - Cria licença
- `POST /licenses/validate` - Valida e ativa licença

Exemplo payload `POST /licenses/validate`:

```json
{
  "code": "INJ-ABC123",
  "device": "HWID-001"
}
```

## Produtos

- `GET /products`
- `POST /products`

## Utilizadores

- `GET /users`

## Estatísticas

- `GET /stats`

## Logs

- `GET /logs`

## Notifications

- `GET /notifications`

## Analytics

- `GET /analytics`

## Payments

- `GET /payments`

## Swagger/OpenAPI

- `GET /docs` retorna OpenAPI JSON para integração com Swagger UI.
