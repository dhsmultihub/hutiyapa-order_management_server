import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderModel } from '../../models/order.model';
import { OrderValidatorService } from '../lifecycle/order-validator.service';
import { OrderProcessorService } from '../lifecycle/order-processor.service';

@Injectable()
export class OrderCreatorService {
    private readonly logger = new Logger(OrderCreatorService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly validator: OrderValidatorService,
        private readonly processor: OrderProcessorService,
    ) { }

    async create(createOrderDto: CreateOrderDto, orderNumber: string) {
        this.validator.validateCreate(createOrderDto);

        if (createOrderDto.useSameAddressForBilling) {
            createOrderDto.setSameAddressForBilling();
        }

        this.processor.validateInventory(createOrderDto);

        const orderModel = OrderModel.fromCreateDto(createOrderDto, orderNumber);
        this.validator.validateOrderModel(orderModel);

        const order = await this.prisma.order.create({
            data: orderModel.toPrismaCreate(),
            include: {
                orderItems: true,
                payments: true,
                shipments: true,
                returns: true,
                refunds: true,
            },
        });

        this.logger.log(`Created order ${order.orderNumber}`);
        return order;
    }
}


