import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';

@Module({
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService], // Exportar para uso em outros módulos (ex: Pedidos)
})
export class ClientesModule {}
