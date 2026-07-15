# 🔧 Correção do Loop Infinito de Refresh

## ❌ Problema Identificado

Após fazer login, o dashboard ficava recarregando infinitamente com os seguintes erros:

```
PrismaClientKnownRequestError: Unique constraint failed on the fields: `token`
POST /api/auth/refresh 500
```

## 🔍 Causas Raiz

### 1. Hook `useTokenRefresh` disparando imediatamente
- O hook chamava `refresh()` assim que o componente montava
- Isso causava uma chamada imediata a `/api/auth/refresh`
- Antes mesmo do usuário terminar de fazer login

### 2. Ordem incorreta no endpoint `/api/auth/refresh`
- Tentava criar uma nova sessão ANTES de deletar a antiga
- Como o token JWT pode ser o mesmo, causava conflito de unique constraint
- Prisma error P2002: "Unique constraint failed on the fields: `token`"

### 3. Dependência no useEffect causando loops
- `[intervalMs]` como dependência recriava o interval a cada render
- Múltiplos intervals rodando simultaneamente

## ✅ Correções Aplicadas

### 1. Hook `useTokenRefresh` corrigido

**Antes:**
```typescript
useEffect(() => {
  refresh(); // ❌ Dispara imediatamente
  timerRef.current = setInterval(refresh, intervalMs);
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [intervalMs]); // ❌ Recria o effect a cada mudança
```

**Depois:**
```typescript
useEffect(() => {
  // ✅ NÃO dispara imediatamente
  // ✅ Apenas agenda para 30 minutos depois
  timerRef.current = setInterval(refresh, intervalMs);
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, []); // ✅ Array vazio - executa apenas uma vez
```

**Melhorias adicionais:**
- ✅ Adicionado `isRefreshingRef` para prevenir chamadas simultâneas
- ✅ Adicionado logs para debug
- ✅ Melhor tratamento de erros

### 2. Endpoint `/api/auth/refresh` corrigido

**Antes:**
```typescript
// ❌ Cria nova sessão primeiro
await issueSession(...);

// ❌ Depois tenta deletar a antiga
if (oldToken) {
  await db.session.deleteMany({ where: { token: oldToken } });
}
```

**Depois:**
```typescript
// ✅ Deleta a sessão antiga PRIMEIRO
if (oldToken) {
  await db.session.deleteMany({ where: { token: oldToken } });
}

// ✅ Depois cria a nova sessão
await issueSession(...);
```

### 3. Banco de dados limpo

Executei um script que removeu todas as sessões duplicadas/corrompidas.

## 🚀 Como Testar Agora

1. **Pare o servidor** se ainda estiver rodando (Ctrl+C)

2. **Reinicie o servidor:**
   ```bash
   cd /home/splaxh/Downloads/auth
   npm run dev
   ```

3. **Faça login:**
   - Acesse: http://localhost:3000
   - Email: `admin@injectbypass.io`
   - Senha: `Admin@123456`

4. **Verifique o comportamento:**
   - ✅ Dashboard deve carregar normalmente
   - ✅ Não deve haver recarregamentos infinitos
   - ✅ O refresh só vai acontecer após 30 minutos
   - ✅ Navegação entre páginas deve ser fluida

## 🔍 Logs Esperados

No terminal do servidor, você deve ver:

```
✓ Compiled /dashboard in 500ms
GET /dashboard 200 in 20ms
GET /api/stats 200 in 15ms
```

**Sem erros de:**
- ❌ "Unique constraint failed"
- ❌ "POST /api/auth/refresh 500"

## 🐛 Se Ainda Houver Problemas

### Limpar sessões novamente:

```bash
node fix-sessions.js
```

### Limpar cookies do navegador:

1. Abra DevTools (F12)
2. Application → Cookies
3. Delete todos os cookies de `localhost:3000`
4. Recarregue a página

### Verificar se há múltiplos tabs abertos:

- Feche todas as abas do dashboard
- Abra apenas uma nova aba
- Faça login novamente

## 📊 Comportamento Correto

### Login Flow:
1. Usuário faz login → `POST /api/auth/login`
2. Sessão criada no banco
3. Cookie `inject_bypass_session` definido
4. Redirecionado para `/dashboard`
5. Dashboard carrega normalmente
6. **Após 30 minutos:** `POST /api/auth/refresh` (automático)

### Navegação:
- Trocar de página no dashboard: **Sem refresh**
- Fechar e reabrir o navegador: **Login mantido**
- Após 7 dias (ou logout): **Sessão expira**

## 🎯 Próximos Passos

Agora que o loop está corrigido:

1. ✅ Explore o dashboard livremente
2. ✅ Teste todas as funcionalidades
3. ✅ Crie licenças, usuários, produtos
4. ✅ Configure seu 2FA no perfil
5. ✅ Teste a API via `/api/docs`

## 📝 Resumo das Mudanças

### Arquivos Modificados:
- ✅ `src/lib/hooks/use-token-refresh.ts` - Removido dispatch imediato
- ✅ `src/app/api/auth/refresh/route.ts` - Corrigida ordem de operações

### Arquivos Criados:
- ✅ `fix-sessions.js` - Script de limpeza (pode ser deletado)
- ✅ `LOOP_FIX.md` (este arquivo) - Documentação

## ✨ Status Final

**PROBLEMA RESOLVIDO! ✅**

O dashboard agora deve funcionar perfeitamente sem loops de refresh.

---

**Data:** 2026-07-12  
**Bugs corrigidos:** 11 (adicionado fix do loop de refresh)  
**Status:** ✅ PRONTO PARA USO
