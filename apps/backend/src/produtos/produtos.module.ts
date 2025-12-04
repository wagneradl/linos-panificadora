import { Module } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { ProdutosController } from './produtos.controller';

@Module({
  controllers: [ProdutosController],
  providers: [ProdutosService],
  exports: [ProdutosService], // Exportar para uso em outros módulos (ex: Pedidos)
})
export class ProdutosModule {}
