import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Obter dados do administrador das variáveis de ambiente
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFullName = process.env.ADMIN_FULL_NAME || 'Administrador do Sistema';

  // Validar se as variáveis de ambiente estão configuradas
  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  AVISO: Variáveis ADMIN_EMAIL e/ou ADMIN_PASSWORD não configuradas.');
    console.warn('⚠️  Pulando criação do usuário administrador.');
    console.warn('⚠️  Configure essas variáveis no arquivo .env para criar o admin automaticamente.\n');
    return;
  }

  // Verificar se o admin já existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Usuário administrador já existe: ${adminEmail}`);
    console.log(`   Nome: ${existingAdmin.fullName}`);
    console.log(`   Role: ${existingAdmin.role}\n`);
    return;
  }

  // Criar hash da senha
  console.log('🔐 Gerando hash da senha...');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Criar username baseado no email
  const username = adminEmail.split('@')[0];

  // Criar usuário administrador
  console.log('👤 Criando usuário administrador...');
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      username: username,
      password: hashedPassword,
      fullName: adminFullName,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('\n✅ Usuário administrador criado com sucesso!');
  console.log('=========================================');
  console.log(`📧 Email: ${admin.email}`);
  console.log(`👤 Username: ${admin.username}`);
  console.log(`📝 Nome: ${admin.fullName}`);
  console.log(`🔑 Role: ${admin.role}`);
  console.log(`🆔 ID: ${admin.id}`);
  console.log('=========================================\n');

  console.log('💡 Dica: Use essas credenciais para fazer login no sistema.');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Senha: ${adminPassword}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
