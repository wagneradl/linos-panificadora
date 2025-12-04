import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(3, { message: 'Username deve ter no mínimo 3 caracteres' })
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @IsOptional()
  password?: string;

  @IsString()
  @MinLength(3, { message: 'Nome completo deve ter no mínimo 3 caracteres' })
  @IsOptional()
  fullName?: string;

  @IsEnum(Role, { message: 'Role inválida' })
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
