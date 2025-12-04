import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Criar novo pedido com itens
   */
  async create(createPedidoDto: CreatePedidoDto) {
    // Verificar se cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createPedidoDto.clienteId },
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${createPedidoDto.clienteId} não encontrado`);
    }

    // Buscar informações dos produtos e calcular valores
    let valorTotal = 0;
    const itensComPrecos = [];

    for (const item of createPedidoDto.itens) {
      const produto = await this.prisma.produto.findUnique({
        where: { id: item.produtoId },
      });

      if (!produto) {
        throw new NotFoundException(`Produto com ID ${item.produtoId} não encontrado`);
      }

      // Verificar estoque
      if (produto.estoque < item.quantidade) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.estoque}, Solicitado: ${item.quantidade}`,
        );
      }

      const precoUnitario = produto.preco;
      const subtotal = precoUnitario * item.quantidade;
      valorTotal += subtotal;

      itensComPrecos.push({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario,
        subtotal,
      });
    }

    // Criar pedido com itens em uma transação
    return this.prisma.$transaction(async (prisma) => {
      // Criar pedido
      const pedido = await prisma.pedido.create({
        data: {
          clienteId: createPedidoDto.clienteId,
          observacao: createPedidoDto.observacao,
          valorTotal,
          itensPedido: {
            create: itensComPrecos,
          },
        },
        include: {
          cliente: true,
          itensPedido: {
            include: {
              produto: true,
            },
          },
        },
      });

      // Atualizar estoque dos produtos
      for (const item of createPedidoDto.itens) {
        await prisma.produto.update({
          where: { id: item.produtoId },
          data: {
            estoque: {
              decrement: item.quantidade,
            },
          },
        });
      }

      return pedido;
    });
  }

  /**
   * Listar todos os pedidos
   */
  async findAll() {
    return this.prisma.pedido.findMany({
      orderBy: { dataPedido: 'desc' },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        _count: {
          select: { itensPedido: true },
        },
      },
    });
  }

  /**
   * Buscar pedido por ID com todos os detalhes
   */
  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        itensPedido: {
          include: {
            produto: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }

    return pedido;
  }

  /**
   * Atualizar status ou observação do pedido
   */
  async update(id: number, updatePedidoDto: UpdatePedidoDto) {
    // Verificar se pedido existe
    await this.findOne(id);

    return this.prisma.pedido.update({
      where: { id },
      data: updatePedidoDto,
      include: {
        cliente: true,
        itensPedido: {
          include: {
            produto: true,
          },
        },
      },
    });
  }

  /**
   * Cancelar pedido (revertendo estoque)
   */
  async cancel(id: number) {
    const pedido = await this.findOne(id);

    if (pedido.status === 'cancelado') {
      throw new BadRequestException('Pedido já está cancelado');
    }

    if (pedido.status === 'entregue') {
      throw new BadRequestException('Não é possível cancelar pedido já entregue');
    }

    // Cancelar e reverter estoque em transação
    return this.prisma.$transaction(async (prisma) => {
      // Atualizar status para cancelado
      const pedidoCancelado = await prisma.pedido.update({
        where: { id },
        data: { status: 'cancelado' },
        include: {
          cliente: true,
          itensPedido: {
            include: {
              produto: true,
            },
          },
        },
      });

      // Reverter estoque dos produtos
      for (const item of pedido.itensPedido) {
        await prisma.produto.update({
          where: { id: item.produtoId },
          data: {
            estoque: {
              increment: item.quantidade,
            },
          },
        });
      }

      return pedidoCancelado;
    });
  }

  /**
   * Buscar pedidos de um cliente
   */
  async findByCliente(clienteId: number) {
    return this.prisma.pedido.findMany({
      where: { clienteId },
      orderBy: { dataPedido: 'desc' },
      include: {
        _count: {
          select: { itensPedido: true },
        },
      },
    });
  }
}
