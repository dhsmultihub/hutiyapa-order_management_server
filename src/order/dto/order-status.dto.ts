import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from './update-order.dto';

export class OrderStatusDto {
    @ApiProperty({ description: 'Target order status', enum: OrderStatus })
    @IsEnum(OrderStatus)
    status: OrderStatus;
}


