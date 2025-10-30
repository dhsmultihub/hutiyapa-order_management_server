import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FulfillmentService } from './services/fulfillment.service';
import { TrackingService } from './services/tracking.service';
import { DeliveryService } from './services/delivery.service';
import { ShipmentRequestDto } from './dto/shipment-request.dto';
import { TrackingUpdateDto } from './dto/tracking-update.dto';
import { ShipmentResponseDto, TrackingEventDto, ShipmentSummaryDto, ShippingRateDto } from './dto/shipment-response.dto';

@Injectable()
export class ShipmentService {
    private readonly logger = new Logger(ShipmentService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly fulfillmentService: FulfillmentService,
        private readonly trackingService: TrackingService,
        private readonly deliveryService: DeliveryService,
    ) { }

    async createShipment(request: ShipmentRequestDto): Promise<ShipmentResponseDto> {
        this.logger.log(`Creating shipment for order ${request.orderId}`);
        return this.fulfillmentService.createShipment(request);
    }

    async getShipment(shipmentId: string): Promise<ShipmentResponseDto> {
        this.logger.log(`Getting shipment ${shipmentId}`);
        return this.fulfillmentService.getShipment(shipmentId);
    }

    async getShipmentsByOrder(orderId: string): Promise<ShipmentResponseDto[]> {
        this.logger.log(`Getting shipments for order ${orderId}`);
        return this.fulfillmentService.getShipmentsByOrder(orderId);
    }

    async updateShipmentStatus(shipmentId: string, status: string): Promise<ShipmentResponseDto> {
        this.logger.log(`Updating shipment ${shipmentId} status to ${status}`);
        return this.fulfillmentService.updateShipmentStatus(shipmentId, status);
    }

    async trackShipment(trackingNumber: string): Promise<any> {
        this.logger.log(`Tracking shipment: ${trackingNumber}`);
        return this.trackingService.trackShipment(trackingNumber);
    }

    async addTrackingEvent(shipmentId: string, trackingUpdate: TrackingUpdateDto): Promise<TrackingEventDto> {
        this.logger.log(`Adding tracking event for shipment ${shipmentId}`);
        return this.trackingService.addTrackingEvent(shipmentId, trackingUpdate);
    }

    async getTrackingEvents(shipmentId: string): Promise<TrackingEventDto[]> {
        this.logger.log(`Getting tracking events for shipment ${shipmentId}`);
        return this.trackingService.getTrackingEvents(shipmentId);
    }

    async confirmDelivery(shipmentId: string, deliveryNotes?: string): Promise<void> {
        this.logger.log(`Confirming delivery for shipment ${shipmentId}`);
        return this.deliveryService.confirmDelivery(shipmentId, deliveryNotes);
    }

    async reportDeliveryIssue(shipmentId: string, issue: string, notes?: string): Promise<void> {
        this.logger.log(`Reporting delivery issue for shipment ${shipmentId}`);
        return this.deliveryService.reportDeliveryIssue(shipmentId, issue, notes);
    }

    async rescheduleDelivery(shipmentId: string, newDeliveryDate: Date, reason: string): Promise<void> {
        this.logger.log(`Rescheduling delivery for shipment ${shipmentId}`);
        return this.deliveryService.rescheduleDelivery(shipmentId, newDeliveryDate, reason);
    }

    async getDeliverySummary(orderId?: string): Promise<ShipmentSummaryDto> {
        this.logger.log(`Getting delivery summary${orderId ? ` for order ${orderId}` : ''}`);
        return this.deliveryService.getDeliverySummary(orderId);
    }

    async getDelayedShipments(): Promise<any[]> {
        this.logger.log('Getting delayed shipments');
        return this.deliveryService.getDelayedShipments();
    }

    async getShippingRates(request: ShipmentRequestDto): Promise<ShippingRateDto[]> {
        this.logger.log(`Getting shipping rates for order ${request.orderId}`);

        // This would typically call the carrier APIs to get real rates
        // For now, return mock rates
        const mockRates: ShippingRateDto[] = [
            {
                carrier: request.carrier,
                serviceType: request.serviceType,
                serviceName: `${request.carrier.toUpperCase()} ${request.serviceType.toUpperCase()}`,
                deliveryTime: '1-2 days',
                rate: 200,
                description: 'Express delivery service',
                additionalCharges: {
                    fuel_surcharge: 20,
                    insurance: 50,
                },
                totalRate: 270,
            },
        ];

        return mockRates;
    }
}