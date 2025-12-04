import { IsNumber, IsString, IsOptional, IsArray, ValidateNested, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateItemPedidoDto } from './create-item-pedido.dto';

export class CreatePedidoDto {
  @IsNumber()
  @Min(1, { message: 'ID do cliente inválido' })
  clienteId: number;

  @IsString()
  @IsOptional()
  observacao?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Pedido deve ter pelo menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateItemPedidoDto)
  itens: CreateItemPedidoDto[];
}
