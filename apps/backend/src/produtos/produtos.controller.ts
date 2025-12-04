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
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  /**
   * POST /produtos
   * Criar produto (ADMIN e OPERATOR)
   */
  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  create(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtosService.create(createProdutoDto);
  }

  /**
   * GET /produtos
   * Listar todos os produtos (todos os autenticados)
   */
  @Get()
  findAll(@Query('categoria') categoria?: string) {
    if (categoria) {
      return this.produtosService.findByCategoria(categoria);
    }
    return this.produtosService.findAll();
  }

  /**
   * GET /produtos/:id
   * Obter produto por ID (todos os autenticados)
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.findOne(id);
  }

  /**
   * PATCH /produtos/:id
   * Atualizar produto (ADMIN e OPERATOR)
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProdutoDto: UpdateProdutoDto,
  ) {
    return this.produtosService.update(id, updateProdutoDto);
  }

  /**
   * DELETE /produtos/:id
   * Remover produto (ADMIN e OPERATOR)
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.OPERATOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.remove(id);
  }

  /**
   * PATCH /produtos/:id/estoque
   * Atualizar estoque do produto (ADMIN e OPERATOR)
   */
  @Patch(':id/estoque')
  @Roles(Role.ADMIN, Role.OPERATOR)
  updateEstoque(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantidade', ParseIntPipe) quantidade: number,
  ) {
    return this.produtosService.updateEstoque(id, quantidade);
  }
}
