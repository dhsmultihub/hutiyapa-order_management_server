import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderModel } from '../../models/order.model';

@Injectable()
export class OrderStateMachineService {
    validateTransition(order: OrderModel, targetStatus: string): void {
        const current = order.status?.toUpperCase();
        const target = targetStatus?.toUpperCase();

        const allowed: Record<string, string[]> = {
            PENDING: ['CONFIRMED', 'CANCELLED'],
            CONFIRMED: ['PROCESSING', 'CANCELLED'],
            PROCESSING: ['SHIPPED', 'CANCELLED'],
            SHIPPED: ['DELIVERED'],
            DELIVERED: ['COMPLETED', 'RETURNED'],
            COMPLETED: [],
            CANCELLED: [],
        };

        if (!allowed[current] || !allowed[current].includes(target)) {
            throw new BadRequestException(`Invalid status transition from ${current} to ${target}`);
        }
    }

    applyTransition(order: OrderModel, targetStatus: string): void {
        switch (targetStatus.toUpperCase()) {
            case 'CONFIRMED':
                order.confirm();
                break;
            case 'PROCESSING':
                order.process();
                break;
            case 'SHIPPED':
                order.ship();
                break;
            case 'DELIVERED':
                order.deliver();
                break;
            case 'COMPLETED':
                order.complete();
                break;
            case 'CANCELLED':
                order.cancel();
                break;
            default:
                throw new BadRequestException(`Unsupported target status: ${targetStatus}`);
        }
    }
}


