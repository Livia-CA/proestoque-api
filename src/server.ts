import 'dotenv/config';

import app from './app';
import { prisma } from './prisma/client';

const port = Number(process.env.PORT) || 3333;

async function start() {
  try {
    await prisma.$connect();
    console.log('Banco de dados conectado');

    app.listen(port, () => {
      console.log(`API ProEstoque rodando na porta ${port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar a API:', error);
    process.exit(1);
  }
}

void start();