import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client'; // 
// Importando o dotenv para carregar variáveis de ambiente


dotenv.config();

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Banco conectado, iniciando servidor...');
  } catch (err) {
    console.error('❌ Falha na conexão com o banco de dados:', err);
    process.exit(1);
  }
};

export { connectDB, prisma };
