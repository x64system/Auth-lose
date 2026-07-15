# Configuração do Banco de Dados

## ❌ Problema Encontrado

O arquivo `.env` estava configurado para SQLite (`file:./dev.db`), mas o projeto requer **PostgreSQL**.

Já corrigi o arquivo `.env` com a configuração correta do PostgreSQL.

---

## ✅ Solução: Instalar PostgreSQL

Você tem 3 opções para rodar o banco de dados:

---

### **Opção 1: Docker (Recomendado - Mais Fácil)** 🐳

Se você tem Docker instalado:

```bash
cd /home/splaxh/Downloads/auth

# Subir apenas o banco de dados
docker compose up -d db

# Aguardar alguns segundos para o banco iniciar
sleep 5

# Executar migrações
npm run prisma:migrate

# Popular com dados demo
npm run prisma:seed

# Iniciar o servidor
npm run dev
```

**Se não tiver Docker instalado**, instale com:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Faça logout e login novamente para aplicar as permissões
```

---

### **Opção 2: PostgreSQL Local** 💻

Se preferir instalar PostgreSQL diretamente no sistema:

```bash
# 1. Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# 2. Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Criar usuário e banco de dados
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE inject_bypass OWNER postgres;"

# 4. Voltar para o projeto e executar migrações
cd /home/splaxh/Downloads/auth
npm run prisma:migrate

# 5. Popular com dados demo
npm run prisma:seed

# 6. Iniciar o servidor
npm run dev
```

---

### **Opção 3: PostgreSQL Temporário (Embedded)** ⚡

O projeto já tem suporte para PostgreSQL embedded para desenvolvimento rápido:

```bash
cd /home/splaxh/Downloads/auth

# Instalar embedded-postgres (já está no package.json)
npm install

# Criar script de inicialização
cat > start-embedded-db.js << 'EOF'
const EmbeddedPostgres = require('embedded-postgres');

const pg = new EmbeddedPostgres({
  database_dir: './.local-pg-data',
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  persistent: true
});

(async () => {
  try {
    await pg.initialise();
    await pg.start();
    console.log('✅ PostgreSQL Embedded iniciado na porta 5432');
    console.log('📊 Dados em: ./.local-pg-data');
    console.log('\n🚀 Agora execute em outro terminal:');
    console.log('   npm run prisma:migrate');
    console.log('   npm run prisma:seed');
    console.log('   npm run dev');
    console.log('\n⏹️  Para parar: Ctrl+C');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
})();
EOF

# Executar (mantenha rodando)
node start-embedded-db.js
```

**Em outro terminal:**

```bash
cd /home/splaxh/Downloads/auth
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

---

## 🔧 Verificar Status do PostgreSQL

### Se usar Docker:
```bash
docker compose ps
docker compose logs db
```

### Se usar PostgreSQL local:
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

### Se usar embedded:
```bash
# Verificar se a porta 5432 está ocupada
lsof -i :5432
# ou
netstat -tuln | grep 5432
```

---

## 🎯 Após o Banco Estar Rodando

Execute estes comandos na ordem:

```bash
cd /home/splaxh/Downloads/auth

# 1. Gerar cliente Prisma
npm run prisma:generate

# 2. Executar migrações (cria as tabelas)
npm run prisma:migrate

# 3. Popular com dados demo
npm run prisma:seed

# 4. Iniciar o servidor
npm run dev
```

---

## 📊 Credenciais de Acesso

Após popular o banco com `npm run prisma:seed`:

**Frontend:**
- URL: http://localhost:3000
- Email: `admin@injectbypass.io`
- Senha: `Admin@123456`

**API NestJS (opcional):**
- URL: http://localhost:4000/docs
- Swagger UI com documentação completa

---

## 🔍 Troubleshooting

### Erro: "Port 5432 is already in use"

Outra instância do PostgreSQL já está rodando:

```bash
# Ver o que está usando a porta
sudo lsof -i :5432

# Se for PostgreSQL sistema, pode usar ele:
# Nada a fazer, o .env já está configurado corretamente!

# Se for outro processo, mate-o:
sudo kill -9 <PID>
```

### Erro: "password authentication failed"

Verifique o `.env`:

```bash
cat .env
# Deve ter:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inject_bypass?schema=public"
```

### Erro: "database does not exist"

Criar o banco manualmente:

```bash
# Docker
docker compose exec db psql -U postgres -c "CREATE DATABASE inject_bypass;"

# PostgreSQL local
sudo -u postgres psql -c "CREATE DATABASE inject_bypass;"
```

---

## 🎉 Sucesso!

Quando tudo estiver funcionando, você verá:

```
✓ Ready in 2.3s
- Local: http://localhost:3000
```

Acesse http://localhost:3000 e faça login! 🚀

---

## 📝 Notas Importantes

1. **Docker é a forma mais fácil** - apenas um comando e está pronto
2. O diretório `.local-pg-data` contém dados temporários (já existe no projeto)
3. As migrações criam todas as tabelas automaticamente
4. O seed cria dados demo incluindo usuário admin
5. Em produção, use PostgreSQL gerenciado (AWS RDS, Heroku, Supabase, etc.)

---

## 🔗 Links Úteis

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Download](https://www.postgresql.org/download/)
- [Docker Installation](https://docs.docker.com/engine/install/ubuntu/)

---

**Status atual:** ✅ `.env` corrigido e pronto para PostgreSQL
