import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Criar novo produto
   */
  async create(createProdutoDto: CreateProdutoDto) {
    return this.prisma.produto.create({
      data: createProdutoDto,
    });
  }

  /**
   * Listar todos os produtos
   */
  async findAll() {
    return this.prisma.produto.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  /**
   * Buscar produto por ID
   */
  async findOne(id: number) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
    });

    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }

    return produto;
  }

  /**
   * Atualizar produto
   */
  async update(id: number, updateProdutoDto: UpdateProdutoDto) {
    // Verificar se produto existe
    await this.findOne(id);

    return this.prisma.produto.update({
      where: { id },
      data: updateProdutoDto,
    });
  }

  /**
   * Remover produto
   */
  async remove(id: number) {
    // Verificar se produto existe
    await this.findOne(id);

    await this.prisma.produto.delete({
      where: { id },
    });
  }

  /**
   * Buscar produtos por categoria
   */
  async findByCategoria(categoria: string) {
    return this.prisma.produto.findMany({
      where: { categoria },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Atualizar estoque
   */
  async updateEstoque(id: number, quantidade: number) {
    await this.findOne(id);

    return this.prisma.produto.update({
      where: { id },
      data: {
        estoque: {
          increment: quantidade, // Pode ser positivo ou negativo
        },
      },
    });
  }
}
