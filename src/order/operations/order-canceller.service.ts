import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderModel } from '../../models/order.model';

@Injectable()
export class OrderCancellerService {
    constructor(private readonly prisma: PrismaService) { }

    async cancel(id: string) {
        const existing = await this.prisma.order.findUnique({ where: { id: BigInt(id) } });
        if (!existing) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        const model = OrderModel.fromPrisma(existing);
        if (!model.canBeCancelled()) {
            throw new BadRequestException('Order cannot be cancelled in current status');
        }
        model.cancel();

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


