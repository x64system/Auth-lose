# 🚀 Quick Start - Inject Bypass

## ⚡ Instalação Rápida (3 Comandos)

O projeto está **quase pronto**! Só falta configurar o banco de dados PostgreSQL.

### Opção 1: Script Automático (RECOMENDADO)

```bash
cd /home/splaxh/Downloads/auth
./setup.sh
```

O script vai:
- ✅ Verificar e corrigir o `.env`
- ✅ Detectar se PostgreSQL está rodando
- ✅ Oferecer opções se não estiver (Docker, local ou SQLite)
- ✅ Executar migrações
- ✅ Popular dados demo
- ✅ Preparar tudo para rodar

Depois basta:

```bash
npm run dev
```

---

### Opção 2: Manual (Se Souber O Que Está Fazendo)

#### Se você já tem PostgreSQL rodando:

```bash
cd /home/splaxh/Downloads/auth

# Criar banco
sudo -u postgres psql -c "CREATE DATABASE inject_bypass OWNER postgres;"

# Executar setup
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

#### Se você tem Docker:

```bash
cd /home/splaxh/Downloads/auth

# Subir banco
docker compose up -d db

# Aguardar 5 segundos
sleep 5

# Executar setup
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

---

## 🎯 Acessar o Sistema

Após `npm run dev`:

**Frontend:**
- 🌐 URL: http://localhost:3000
- 📧 Email: `admin@injectbypass.io`
- 🔑 Senha: `Admin@123456`

**API (opcional):**
- 🔧 Swagger: http://localhost:4000/docs

---

## ❌ Erro Atual

O erro que você viu aconteceu porque:

```
DATABASE_URL estava: "file:./dev.db" (SQLite)
Prisma schema espera: PostgreSQL
```

Já corrigi o `.env` para:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inject_bypass?schema=public"
```

**Agora só falta subir o PostgreSQL!**

---

## 🔧 Instalar PostgreSQL

### Ubuntu/Debian:

```bash
# Com Docker (mais fácil)
sudo apt install docker.io docker-compose-v2 -y
sudo usermod -aG docker $USER
# Logout e login novamente

# Ou instalação local
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
```

---

## 📚 Documentação Completa

- **SETUP_DATABASE.md** - Guia detalhado de configuração do banco
- **BUGS_FIXED.md** - Lista dos bugs corrigidos
- **SECURITY_CHECKLIST.md** - Checklist de segurança
- **FEATURE_COMPARISON.md** - Comparação de funcionalidades
- **README.md** - Documentação completa do projeto

---

## 🆘 Precisa de Ajuda?

Execute o script automático:

```bash
./setup.sh
```

Ele vai guiar você através de todas as opções! 🚀
