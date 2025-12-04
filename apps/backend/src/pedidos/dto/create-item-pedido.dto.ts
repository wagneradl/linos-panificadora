import { IsNumber, Min } from 'class-validator';

export class CreateItemPedidoDto {
  @IsNumber()
  @Min(1, { message: 'ID do produto inválido' })
  produtoId: number;

  @IsNumber()
  @Min(1, { message: 'Quantidade deve ser maior que zero' })
  quantidade: number;
}
