import { Module } from '@nestjs/common';
import { ShipmentController } from './shipment.controller';
import { ShipmentService } from './shipment.service';
import { FulfillmentService } from './services/fulfillment.service';
import { TrackingService } from './services/tracking.service';
import { DeliveryService } from './services/delivery.service';
import { BlueDartCarrier } from './carriers/blue-dart.carrier';
import { FedExCarrier } from './carriers/fedex.carrier';
import { DHLCarrier } from './carriers/dhl.carrier';

@Module({
    controllers: [ShipmentController],
    providers: [
        ShipmentService,
        FulfillmentService,
        TrackingService,
        DeliveryService,
        BlueDartCarrier,
        FedExCarrier,
        DHLCarrier,
    ],
    exports: [ShipmentService, FulfillmentService, TrackingService, DeliveryService],
})
export class ShipmentModule { }