import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Criar novo usuário
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar se email já existe
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email já está em uso');
    }

    // Verificar se username já existe
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    return new UserResponseDto(user);
  }

  /**
   * Listar todos os usuários
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => new UserResponseDto(user));
  }

  /**
   * Buscar usuário por ID
   */
  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return new UserResponseDto(user);
  }

  /**
   * Buscar usuário por email (com senha - para autenticação)
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Buscar usuário por username (com senha - para autenticação)
   */
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Atualizar usuário
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Verificar se usuário existe
    await this.findOne(id);

    // Se estiver atualizando email, verificar se não está em uso
    if (updateUserDto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          NOT: { id },
        },
      });
      if (existingEmail) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Se estiver atualizando username, verificar se não está em uso
    if (updateUserDto.username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: {
          username: updateUserDto.username,
          NOT: { id },
        },
      });
      if (existingUsername) {
        throw new ConflictException('Username já está em uso');
      }
    }

    // Se estiver atualizando senha, fazer hash
    const data = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return new UserResponseDto(user);
  }

  /**
   * Remover usuário
   */
  async remove(id: number): Promise<void> {
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Atualizar último login
   */
  async updateLastLogin(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
