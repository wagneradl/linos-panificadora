import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { configuration, validationSchema } from './config';

@Module({
  imports: [
    // Configuração global com validação
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: true, // Para na primeira falha de validação
      },
    }),

    // Servir arquivos estáticos (PDFs)
    ServeStaticModule.forRoot({
      rootPath: process.env.PDF_STORAGE_PATH || join(__dirname, '..', 'pdfs'),
      serveRoot: '/pdfs',
    }),

    // Módulos principais
    PrismaModule,
    HealthModule,

    // TODO: Módulos de negócio serão adicionados nas próximas etapas
    // - AuthModule (autenticação e autorização)
    // - UsersModule (gestão de usuários)
    // - ProdutosModule (CRUD de produtos)
    // - ClientesModule (CRUD de clientes)
    // - PedidosModule (gestão de pedidos)
    // - PdfModule (geração de PDFs)
    // - RelatoriosModule (relatórios)
  ],
})
export class AppModule {}