import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProdutosModule } from './produtos/produtos.module';
import { ClientesModule } from './clientes/clientes.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
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

    // Autenticação e Autorização
    AuthModule,
    UsersModule,

    // Módulos de Negócio
    ProdutosModule,
    ClientesModule,
    PedidosModule,

    // TODO: Módulos adicionais para implementar no futuro
    // - PdfModule (geração de PDFs)
    // - RelatoriosModule (relatórios)
  ],
  providers: [
    // Aplicar JwtAuthGuard globalmente
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Aplicar RolesGuard globalmente
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}