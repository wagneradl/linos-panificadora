import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  /**
   * POST /clientes
   * Criar cliente (ADMIN e OPERATOR)
   */
  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  /**
   * GET /clientes
   * Listar todos os clientes ou buscar por nome (todos os autenticados)
   */
  @Get()
  findAll(@Query('search') search?: string) {
    if (search) {
      return this.clientesService.search(search);
    }
    return this.clientesService.findAll();
  }

  /**
   * GET /clientes/:id
   * Obter cliente por ID com seus pedidos (todos os autenticados)
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  /**
   * PATCH /clientes/:id
   * Atualizar cliente (ADMIN e OPERATOR)
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, updateClienteDto);
  }

  /**
   * DELETE /clientes/:id
   * Remover cliente (ADMIN e OPERATOR)
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(id);
  }
}
