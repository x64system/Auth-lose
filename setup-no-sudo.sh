#!/bin/bash

# Setup SEM sudo - Inject Bypass
# Para quando Docker precisa de permissões que você não tem

set -e

echo "🚀 Inject Bypass - Setup Alternativo (Sem Docker)"
echo "=================================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

echo ""
log_warning "Docker requer permissões de administrador."
echo ""
log_info "Vou configurar o projeto para usar SQLite temporariamente."
log_info "SQLite é perfeito para desenvolvimento local!"
echo ""

# Backup do schema original
if [ ! -f prisma/schema.prisma.backup ]; then
    log_info "Fazendo backup do schema original..."
    cp prisma/schema.prisma prisma/schema.prisma.backup
    log_success "Backup criado!"
fi

# Configurar para SQLite
log_info "Configurando para SQLite..."

# Atualizar .env
cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
JWT_SECRET="inject-bypass-secret-dev-change-me-in-production"
APP_URL="http://localhost:3000"

# Discord Webhook (opcional)
# DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/SEU_ID/SEU_TOKEN"
EOF

log_success ".env configurado para SQLite!"

# Atualizar schema
log_info "Atualizando Prisma schema para SQLite..."
sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
log_success "Schema atualizado!"

# Instalar dependências
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências..."
    npm install
    log_success "Dependências instaladas!"
else
    log_success "Dependências já instaladas!"
fi

# Gerar Prisma Client
log_info "Gerando Prisma Client..."
npm run prisma:generate
log_success "Prisma Client gerado!"

# Limpar banco antigo se existir
if [ -f "dev.db" ]; then
    log_info "Limpando banco antigo..."
    rm -f dev.db dev.db-journal
fi

# Criar banco e executar migrações
log_info "Criando banco SQLite e executando migrações..."
npx prisma migrate dev --name init
log_success "Banco criado e migrações executadas!"

# Popular com dados demo
log_info "Populando banco com dados demo..."
npm run prisma:seed
log_success "Dados demo criados!"

echo ""
echo "======================================"
log_success "Setup concluído com SQLite!"
echo "======================================"
echo ""
log_info "SQLite é ideal para:"
echo "  ✓ Desenvolvimento local"
echo "  ✓ Testes rápidos"
echo "  ✓ Não precisa instalar nada"
echo "  ✓ Banco em arquivo (dev.db)"
echo ""
log_warning "Para produção, você deve usar PostgreSQL!"
echo ""
log_info "Para iniciar o servidor:"
echo ""
echo "    npm run dev"
echo ""
log_info "Acesse:"
echo ""
echo "    🌐 Frontend: http://localhost:3000"
echo ""
log_info "Credenciais:"
echo ""
echo "    📧 Email: admin@injectbypass.io"
echo "    🔑 Senha: Admin@123456"
echo ""
log_info "Para voltar ao PostgreSQL depois:"
echo ""
echo "    cp prisma/schema.prisma.backup prisma/schema.prisma"
echo "    # Configure PostgreSQL"
echo "    npm run prisma:generate"
echo "    npm run prisma:migrate"
echo ""
log_success "Bom desenvolvimento! 🚀"
echo ""
