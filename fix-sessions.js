// Script para limpar sessões duplicadas do banco de dados
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanSessions() {
  try {
    console.log('🧹 Limpando sessões duplicadas...');
    
    // Deletar todas as sessões para começar limpo
    const deleted = await prisma.session.deleteMany({});
    console.log(`✅ ${deleted.count} sessões removidas`);
    
    console.log('✨ Banco limpo! Agora você pode fazer login novamente.');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanSessions();
