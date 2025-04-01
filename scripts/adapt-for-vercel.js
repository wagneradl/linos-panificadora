const fs = require('fs');
const path = require('path');

/**
 * Este script modifica as configurações necessárias para migrar o projeto do Render para o Vercel
 */

console.log('Iniciando a adaptação para o Vercel...');

// 1. Modificar configuração do Prisma para usar serverless na Vercel
const prismaSchemaPath = path.join(__dirname, '..', 'apps', 'backend', 'prisma', 'schema.prisma');
try {
  let prismaSchema = fs.readFileSync(prismaSchemaPath, 'utf8');
  
  // Adicionar provider preview features para serverless
  prismaSchema = prismaSchema.replace(
    'generator client {\n  provider = "prisma-client-js"\n}',
    'generator client {\n  provider = "prisma-client-js"\n  previewFeatures = ["driverAdapters"]\n}'
  );
  
  fs.writeFileSync(prismaSchemaPath, prismaSchema);
  console.log('✅ Configuração do Prisma atualizada para suporte serverless');
} catch (error) {
  console.error('❌ Erro ao modificar schema.prisma:', error);
}

// 2. Criar adapters para SQLite serverless
const dbAdapterPath = path.join(__dirname, '..', 'apps', 'backend', 'src', 'prisma', 'prisma-adapter.ts');
try {
  const dbAdapterContent = `
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaSqliteAdapter } from '@prisma/adapter-sqlite';
import { createClient } from '@libsql/client';
import { DATABASE_URL } from '../config';

let prisma: PrismaClient;

if (process.env.VERCEL) {
  // Configuração específica do Vercel usando TursoDB (libSQL)
  const client = createClient({
    url: DATABASE_URL,
  });

  prisma = new PrismaClient({
    adapter: new PrismaSqliteAdapter({ client })
  });
} else {
  // Configuração padrão
  prisma = new PrismaClient();
}

export default prisma;
`;
  
  fs.writeFileSync(dbAdapterPath, dbAdapterContent);
  console.log('✅ Adapter para SQLite serverless criado');
} catch (error) {
  console.error('❌ Erro ao criar prisma-adapter.ts:', error);
}

// 3. Atualizar package.json com as dependências necessárias para o Vercel
const backendPackagePath = path.join(__dirname, '..', 'apps', 'backend', 'package.json');
try {
  const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
  
  // Adicionar dependências para adaptadores SQLite serverless
  backendPackage.dependencies['@prisma/adapter-sqlite'] = '^5.0.0';
  backendPackage.dependencies['@libsql/client'] = '^0.3.0';
  
  fs.writeFileSync(backendPackagePath, JSON.stringify(backendPackage, null, 2));
  console.log('✅ Dependências do backend atualizadas para o Vercel');
} catch (error) {
  console.error('❌ Erro ao atualizar package.json do backend:', error);
}

console.log('Adaptação para o Vercel concluída! Execute "yarn install" para instalar as novas dependências.');
