import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderModel } from '../../models/order.model';
import { CreateOrderDto } from '../dto/create-order.dto';

@Injectable()
export class OrderProcessorService {
    calculatePricing(createDto: CreateOrderDto): { subtotal: number; taxAmount: number; totalAmount: number } {
        if (!createDto.orderItems || createDto.orderItems.length === 0) {
            throw new BadRequestException('At least one order item is required');
        }
        const subtotal = createDto.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxAmount = createDto.orderItems.reduce((sum, item) => sum + (item.totalPrice * (item.taxRate || 0) / 100), 0);
        const totalAmount = subtotal + taxAmount;
        return { subtotal, taxAmount, totalAmount };
    }

    validateInventory(_createDto: CreateOrderDto): void {
        // Placeholder for inventory validation with Product service
        // Assume inventory is available for now
        return;
    }

    generateConfirmation(order: OrderModel): string {
        // Placeholder for confirmation generation/email
        return `Order ${order.orderNumber} confirmed`;
    }
}


