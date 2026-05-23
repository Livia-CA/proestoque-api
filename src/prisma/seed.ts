import 'dotenv/config';

import { prisma } from './client';

const categorias = [
  { id: 'cat_1', nome: 'Bebidas', icone: 'cafe-outline', cor: '#7c3aed' },
  { id: 'cat_2', nome: 'Alimentos', icone: 'fast-food-outline', cor: '#059669' },
  { id: 'cat_3', nome: 'Limpeza', icone: 'sparkles-outline', cor: '#0284c7' },
  { id: 'cat_4', nome: 'Eletrônicos', icone: 'hardware-chip-outline', cor: '#d97706' },
  { id: 'cat_5', nome: 'Papelaria', icone: 'document-outline', cor: '#db2777' },
];

async function main() {
  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: { id: categoria.id },
      update: categoria,
      create: categoria,
    });
  }

  console.log('Seed concluído com 5 categorias.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });