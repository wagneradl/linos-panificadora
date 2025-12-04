import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Criar novo cliente
   */
  async create(createClienteDto: CreateClienteDto) {
    // Verificar se email já existe (se fornecido)
    if (createClienteDto.email) {
      const existingEmail = await this.prisma.cliente.findUnique({
        where: { email: createClienteDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email já está em uso por outro cliente');
      }
    }

    return this.prisma.cliente.create({
      data: createClienteDto,
    });
  }

  /**
   * Listar todos os clientes
   */
  async findAll() {
    return this.prisma.cliente.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        _count: {
          select: { pedidos: true }, // Contar quantos pedidos o cliente tem
        },
      },
    });
  }

  /**
   * Buscar cliente por ID
   */
  async findOne(id: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        pedidos: {
          orderBy: { dataPedido: 'desc' },
          take: 10, // Últimos 10 pedidos
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
    }

    return cliente;
  }

  /**
   * Atualizar cliente
   */
  async update(id: number, updateClienteDto: UpdateClienteDto) {
    // Verificar se cliente existe
    await this.findOne(id);

    // Se estiver atualizando email, verificar se não está em uso
    if (updateClienteDto.email) {
      const existingEmail = await this.prisma.cliente.findFirst({
        where: {
          email: updateClienteDto.email,
          NOT: { id },
        },
      });
      if (existingEmail) {
        throw new ConflictException('Email já está em uso por outro cliente');
      }
    }

    return this.prisma.cliente.update({
      where: { id },
      data: updateClienteDto,
    });
  }

  /**
   * Remover cliente
   */
  async remove(id: number) {
    // Verificar se cliente existe
    await this.findOne(id);

    // Verificar se cliente tem pedidos
    const pedidosCount = await this.prisma.pedido.count({
      where: { clienteId: id },
    });

    if (pedidosCount > 0) {
      throw new ConflictException(
        `Não é possível remover cliente com ${pedidosCount} pedido(s) associado(s)`,
      );
    }

    await this.prisma.cliente.delete({
      where: { id },
    });
  }

  /**
   * Buscar clientes por nome (busca parcial)
   */
  async search(query: string) {
    return this.prisma.cliente.findMany({
      where: {
        nome: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { nome: 'asc' },
    });
  }
}
