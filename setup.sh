#!/bin/bash

# Script de Setup Automático - Inject Bypass
# Este script verifica e configura o ambiente automaticamente

set -e

echo "🚀 Inject Bypass - Setup Automático"
echo "===================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar se o .env existe
if [ ! -f .env ]; then
    log_error "Arquivo .env não encontrado!"
    log_info "Copiando .env.example para .env..."
    cp .env.example .env
    log_success ".env criado!"
fi

# Verificar configuração do banco
log_info "Verificando configuração do banco de dados..."
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')

if [[ "$DATABASE_URL" == file:* ]]; then
    log_error "DATABASE_URL está configurado para SQLite!"
    log_info "Corrigindo para PostgreSQL..."
    sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inject_bypass?schema=public"|' .env
    log_success "DATABASE_URL corrigido!"
fi

# Verificar se PostgreSQL está rodando
log_info "Verificando PostgreSQL..."

if command -v docker &> /dev/null && docker ps | grep -q postgres; then
    log_success "PostgreSQL rodando via Docker!"
    PG_READY=true
elif nc -z localhost 5432 2>/dev/null; then
    log_success "PostgreSQL rodando localmente!"
    PG_READY=true
else
    log_warning "PostgreSQL não está rodando!"
    log_info ""
    log_info "Escolha uma opção para continuar:"
    log_info ""
    log_info "1) Usar Docker (recomendado - mais fácil)"
    log_info "2) Instalar PostgreSQL local"
    log_info "3) Usar SQLite (alternativa temporária)"
    log_info "4) Sair (configurar manualmente)"
    log_info ""
    read -p "Opção [1-4]: " choice
    
    case $choice in
        1)
            if ! command -v docker &> /dev/null; then
                log_error "Docker não instalado!"
                log_info "Instale com: sudo apt install docker.io docker-compose-v2"
                exit 1
            fi
            log_info "Iniciando PostgreSQL via Docker..."
            docker compose up -d db
            sleep 5
            PG_READY=true
            log_success "PostgreSQL iniciado via Docker!"
            ;;
        2)
            log_info "Instalando PostgreSQL..."
            sudo apt update
            sudo apt install -y postgresql postgresql-contrib
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            
            log_info "Criando usuário e banco..."
            sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true
            sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;" 2>/dev/null || true
            sudo -u postgres psql -c "CREATE DATABASE inject_bypass OWNER postgres;" 2>/dev/null || true
            
            PG_READY=true
            log_success "PostgreSQL configurado!"
            ;;
        3)
            log_warning "Usando SQLite temporariamente..."
            sed -i 's|DATABASE_URL=.*|DATABASE_URL="file:./dev.db"|' .env
            sed -i 's|provider = "postgresql"|provider = "sqlite"|' prisma/schema.prisma
            PG_READY=true
            log_success "SQLite configurado!"
            ;;
        *)
            log_info "Saindo... Leia SETUP_DATABASE.md para instruções manuais."
            exit 0
            ;;
    esac
fi

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

# Executar migrações
log_info "Executando migrações do banco..."
if npm run prisma:migrate 2>&1 | tee /tmp/prisma-migrate.log; then
    log_success "Migrações executadas!"
else
    log_warning "Erro nas migrações - tentando criar o banco..."
    
    # Tentar criar o banco se não existir
    if command -v docker &> /dev/null && docker compose ps | grep -q db; then
        docker compose exec -T db psql -U postgres -c "CREATE DATABASE inject_bypass;" 2>/dev/null || true
    elif command -v psql &> /dev/null; then
        sudo -u postgres psql -c "CREATE DATABASE inject_bypass;" 2>/dev/null || true
    fi
    
    # Tentar novamente
    npm run prisma:migrate
fi

# Popular com dados demo
log_info "Populando banco com dados demo..."
npm run prisma:seed
log_success "Dados demo criados!"

echo ""
echo "======================================"
log_success "Setup concluído com sucesso!"
echo "======================================"
echo ""
log_info "Para iniciar o servidor:"
echo ""
echo "    npm run dev"
echo ""
log_info "Acesse:"
echo ""
echo "    🌐 Frontend: http://localhost:3000"
echo "    🔧 API: http://localhost:4000/docs"
echo ""
log_info "Credenciais de login:"
echo ""
echo "    📧 Email: admin@injectbypass.io"
echo "    🔑 Senha: Admin@123456"
echo ""
log_info "Para ver logs do Docker:"
echo ""
echo "    docker compose logs -f"
echo ""
log_success "Bom desenvolvimento! 🚀"
echo ""
