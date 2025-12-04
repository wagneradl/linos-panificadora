import { Role } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string; // Sempre excluir senha das respostas

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
