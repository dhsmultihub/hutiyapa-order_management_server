import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrderValidatorService } from '../lifecycle/order-validator.service';
import { OrderModel } from '../../models/order.model';

@Injectable()
export class OrderUpdaterService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly validator: OrderValidatorService,
    ) { }

    async update(id: string, dto: UpdateOrderDto) {
        this.validator.validateUpdate(dto);

        const existing = await this.prisma.order.findUnique({ where: { id: BigInt(id) } });
        if (!existing) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        const model = OrderModel.fromPrisma(existing);
        model.updateFromDto(dto);

        const updated = await this.prisma.order.update({
            where: { id: BigInt(id) },
            data: model.toPrismaUpdate(),
            include: {
                orderItems: true,
                payments: true,
                shipments: true,
                returns: true,
                refunds: true,
            },
        });

        return updated;
    }
}


