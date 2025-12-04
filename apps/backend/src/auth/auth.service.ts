import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validar usuário (usado pela LocalStrategy)
   */
  async validateUser(emailOrUsername: string, password: string): Promise<User | null> {
    // Tentar encontrar por email ou username
    let user = await this.usersService.findByEmail(emailOrUsername);
    if (!user) {
      user = await this.usersService.findByUsername(emailOrUsername);
    }

    if (!user) {
      return null;
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Login - retorna tokens e dados do usuário
   */
  async login(user: User): Promise<AuthResponseDto> {
    // Atualizar último login
    await this.usersService.updateLastLogin(user.id);

    // Gerar tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Retornar resposta
    return {
      accessToken,
      refreshToken,
      user: new UserResponseDto(user),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    };
  }

  /**
   * Refresh - gera novos tokens a partir de um refresh token válido
   */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    // Buscar refresh token no banco
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Verificar se token expirou
    if (new Date() > storedToken.expiresAt) {
      // Remover token expirado
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Verificar se usuário está ativo
    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Remover token antigo
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Gerar novos tokens
    const accessToken = this.generateAccessToken(storedToken.user);
    const newRefreshToken = await this.generateRefreshToken(storedToken.user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: new UserResponseDto(storedToken.user),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    };
  }

  /**
   * Gerar access token JWT
   */
  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });
  }

  /**
   * Gerar refresh token e salvar no banco
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      type: 'refresh',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    // Calcular data de expiração
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn');
    const expiresAt = this.calculateExpirationDate(expiresIn);

    // Salvar no banco
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Calcular data de expiração a partir de string (ex: "7d", "30d")
   */
  private calculateExpirationDate(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
      throw new Error('Formato de expiresIn inválido');
    }

    const [, value, unit] = match;
    const now = new Date();

    switch (unit) {
      case 'd':
        return new Date(now.getTime() + parseInt(value) * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + parseInt(value) * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + parseInt(value) * 60 * 1000);
      case 's':
        return new Date(now.getTime() + parseInt(value) * 1000);
      default:
        throw new Error('Unidade de tempo inválida');
    }
  }

  /**
   * Validar access token (usado pela JwtStrategy)
   */
  async validateAccessToken(payload: any): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário inválido ou inativo');
    }

    return user;
  }

  /**
   * Logout - invalidar refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }
}
