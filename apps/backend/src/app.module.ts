import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProdutosModule } from './produtos/produtos.module';
import { ClientesModule } from './clientes/clientes.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PrismaModule } from './prisma/prisma.module';
import { PdfModule } from './pdf/pdf.module';
import { RelatoriosModule } from './relatorios/relatorios.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: process.env.PDF_STORAGE_PATH || join(__dirname, '..', 'pdfs'),
      serveRoot: '/pdfs',
    }),
    PrismaModule,
    ProdutosModule,
    ClientesModule,
    PedidosModule,
    PdfModule,
    RelatoriosModule,
  ],
})
export class AppModule {}
