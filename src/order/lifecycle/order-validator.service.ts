import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrderModel } from '../../models/order.model';

@Injectable()
export class OrderValidatorService {
    validateCreate(dto: CreateOrderDto): void {
        const result = dto.validate();
        if (!result.isValid) {
            throw new BadRequestException(`Validation failed: ${result.errors.join(', ')}`);
        }
    }

    validateUpdate(dto: UpdateOrderDto): void {
        const result = dto.validate();
        if (!result.isValid) {
            throw new BadRequestException(`Validation failed: ${result.errors.join(', ')}`);
        }
    }

    validateOrderModel(order: OrderModel): void {
        const result = order.validate();
        if (!result.isValid) {
            throw new BadRequestException(`Validation failed: ${result.errors.join(', ')}`);
        }
    }
}


