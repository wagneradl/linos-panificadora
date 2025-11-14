import { IsString, IsNumber, IsOptional, Min, MinLength } from 'class-validator';

export class UpdateProdutoDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  @Min(0, { message: 'Preço deve ser maior ou igual a zero' })
  @IsOptional()
  preco?: number;

  @IsNumber()
  @Min(0, { message: 'Estoque deve ser maior ou igual a zero' })
  @IsOptional()
  estoque?: number;

  @IsString()
  @IsOptional()
  categoria?: string;
}
