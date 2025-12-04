import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum PedidoStatus {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  ENTREGUE = 'entregue',
  CANCELADO = 'cancelado',
}

export class UpdatePedidoDto {
  @IsEnum(PedidoStatus, {
    message: 'Status inválido. Valores permitidos: pendente, processando, entregue, cancelado',
  })
  @IsOptional()
  status?: PedidoStatus;

  @IsString()
  @IsOptional()
  observacao?: string;
}
