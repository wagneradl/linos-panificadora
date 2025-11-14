import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  /**
   * POST /pedidos
   * Criar pedido (ADMIN e OPERATOR)
   */
  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidosService.create(createPedidoDto);
  }

  /**
   * GET /pedidos
   * Listar todos os pedidos ou de um cliente específico (todos os autenticados)
   */
  @Get()
  findAll(@Query('clienteId', ParseIntPipe) clienteId?: number) {
    if (clienteId) {
      return this.pedidosService.findByCliente(clienteId);
    }
    return this.pedidosService.findAll();
  }

  /**
   * GET /pedidos/:id
   * Obter pedido completo por ID (todos os autenticados)
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.findOne(id);
  }

  /**
   * PATCH /pedidos/:id
   * Atualizar status ou observação do pedido (ADMIN e OPERATOR)
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ) {
    return this.pedidosService.update(id, updatePedidoDto);
  }

  /**
   * POST /pedidos/:id/cancelar
   * Cancelar pedido e reverter estoque (ADMIN e OPERATOR)
   */
  @Post(':id/cancelar')
  @Roles(Role.ADMIN, Role.OPERATOR)
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.cancel(id);
  }
}
