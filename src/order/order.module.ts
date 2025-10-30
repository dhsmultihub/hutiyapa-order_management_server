import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderStateMachineService } from './lifecycle/order-state-machine.service';
import { OrderProcessorService } from './lifecycle/order-processor.service';
import { OrderValidatorService } from './lifecycle/order-validator.service';
import { OrderCreatorService } from './operations/order-creator.service';
import { OrderUpdaterService } from './operations/order-updater.service';
import { OrderCancellerService } from './operations/order-canceller.service';
import { PaymentModule } from '../payment/payment.module';
import { ShipmentModule } from '../shipment/shipment.module';
import { OrderEventsModule } from '../events/order-events.module';
import { SearchModule } from '../search/search.module';

@Module({
    imports: [PaymentModule, ShipmentModule, OrderEventsModule, SearchModule],
    controllers: [OrderController],
    providers: [
        OrderService,
        OrderStateMachineService,
        OrderProcessorService,
        OrderValidatorService,
        OrderCreatorService,
        OrderUpdaterService,
        OrderCancellerService,
    ],
    exports: [OrderService],
})
export class OrderModule { }
