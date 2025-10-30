import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TrackingUpdateDto } from '../dto/tracking-update.dto';
import { TrackingEventDto } from '../dto/shipment-response.dto';
import { ShippingCarrier } from '../carriers/shipping-carrier.interface';
import { BlueDartCarrier } from '../carriers/blue-dart.carrier';
import { FedExCarrier } from '../carriers/fedex.carrier';
import { DHLCarrier } from '../carriers/dhl.carrier';

@Injectable()
export class TrackingService {
    private readonly logger = new Logger(TrackingService.name);
    private readonly carriers: Map<string, ShippingCarrier>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly blueDartCarrier: BlueDartCarrier,
        private readonly fedExCarrier: FedExCarrier,
        private readonly dhlCarrier: DHLCarrier,
    ) {
        this.carriers = new Map<string, ShippingCarrier>([
            ['blue_dart', this.blueDartCarrier],
            ['fedex', this.fedExCarrier],
            ['dhl', this.dhlCarrier],
        ]);
    }

    async trackShipment(trackingNumber: string): Promise<any> {
        this.logger.log(`Tracking shipment: ${trackingNumber}`);

        // Get shipment details
        const shipment = await this.prisma.shipment.findUnique({
            where: { trackingNumber },
        });

        if (!shipment) {
            throw new NotFoundException(`Shipment with tracking number ${trackingNumber} not found`);
        }

        // Get carrier
        const carrier = this.carriers.get(shipment.carrier);
        if (!carrier) {
            throw new BadRequestException(`Unsupported carrier: ${shipment.carrier}`);
        }

        try {
            // Track with carrier
            const carrierResponse = await carrier.trackShipment(trackingNumber);

            if (!carrierResponse.success) {
                throw new BadRequestException(carrierResponse.error || 'Tracking failed');
            }

            // Update shipment status if changed
            if (carrierResponse.carrierResponse?.status && carrierResponse.carrierResponse.status !== shipment.status) {
                await this.updateShipmentStatus(shipment.id.toString(), carrierResponse.carrierResponse.status);
            }

            return {
                shipment: this.mapShipmentToResponseDto(shipment),
                tracking: carrierResponse.carrierResponse,
                trackingUrl: carrierResponse.trackingUrl,
                estimatedDelivery: carrierResponse.estimatedDelivery,
            };
        } catch (error) {
            this.logger.error('Tracking failed:', error);
            throw error;
        }
    }

    async addTrackingEvent(shipmentId: string, trackingUpdate: TrackingUpdateDto): Promise<TrackingEventDto> {
        this.logger.log(`Adding tracking event for shipment ${shipmentId}`);

        // Validate tracking update
        const validation = trackingUpdate.validate();
        if (!validation.isValid) {
            throw new BadRequestException(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Check if shipment exists
        const shipment = await this.prisma.shipment.findUnique({
            where: { id: BigInt(shipmentId) },
        });

        if (!shipment) {
            throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }

        try {
            // Create tracking event (Note: This would require a tracking_events table in the schema)
            // For now, we'll simulate the creation
            const trackingEvent = {
                id: Date.now().toString(),
                shipmentId: shipmentId,
                status: trackingUpdate.status,
                location: trackingUpdate.location,
                timestamp: new Date(trackingUpdate.timestamp),
                description: trackingUpdate.description,
                carrierResponse: trackingUpdate.carrierResponse,
                createdAt: new Date(),
            };

            // Update shipment status
            await this.updateShipmentStatus(shipmentId, trackingUpdate.status);

            this.logger.log(`Tracking event added for shipment ${shipmentId}`);

            return this.mapTrackingEventToResponseDto(trackingEvent);
        } catch (error) {
            this.logger.error('Failed to add tracking event:', error);
            throw error;
        }
    }

    async getTrackingEvents(shipmentId: string): Promise<TrackingEventDto[]> {
        this.logger.log(`Getting tracking events for shipment ${shipmentId}`);

        // Check if shipment exists
        const shipment = await this.prisma.shipment.findUnique({
            where: { id: BigInt(shipmentId) },
        });

        if (!shipment) {
            throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }

        // For now, return mock tracking events since we don't have a tracking_events table
        const mockEvents = [
            {
                id: '1',
                shipmentId: shipmentId,
                status: 'PICKED_UP',
                location: 'Origin',
                timestamp: shipment.createdAt,
                description: 'Package picked up from origin',
                carrierResponse: {},
                createdAt: shipment.createdAt,
            },
            {
                id: '2',
                shipmentId: shipmentId,
                status: shipment.status,
                location: 'In Transit',
                timestamp: new Date(),
                description: `Package is ${shipment.status.toLowerCase()}`,
                carrierResponse: {},
                createdAt: new Date(),
            },
        ];

        return mockEvents.map(event => this.mapTrackingEventToResponseDto(event));
    }

    private async updateShipmentStatus(shipmentId: string, status: string): Promise<void> {
        const updateData: any = { status };

        if (status === 'DELIVERED') {
            updateData.deliveredAt = new Date();
        }

        await this.prisma.shipment.update({
            where: { id: BigInt(shipmentId) },
            data: updateData,
        });

        // Update order status if delivered
        if (status === 'DELIVERED') {
            const shipment = await this.prisma.shipment.findUnique({
                where: { id: BigInt(shipmentId) },
                select: { orderId: true },
            });

            if (shipment) {
                await this.prisma.order.update({
                    where: { id: shipment.orderId },
                    data: {
                        status: 'DELIVERED',
                        deliveredAt: new Date(),
                    },
                });
            }
        }
    }

    private mapShipmentToResponseDto(shipment: any): any {
        return {
            id: shipment.id.toString(),
            orderId: shipment.orderId.toString(),
            trackingNumber: shipment.trackingNumber,
            carrier: shipment.carrier,
            serviceType: shipment.serviceType,
            status: shipment.status,
            shippedAt: shipment.shippedAt,
            deliveredAt: shipment.deliveredAt,
            estimatedDelivery: shipment.estimatedDelivery,
            trackingUrl: shipment.trackingUrl,
            createdAt: shipment.createdAt,
            updatedAt: shipment.updatedAt,
        };
    }

    private mapTrackingEventToResponseDto(event: any): TrackingEventDto {
        return {
            id: event.id,
            shipmentId: event.shipmentId,
            status: event.status,
            location: event.location,
            timestamp: event.timestamp,
            description: event.description,
            carrierResponse: event.carrierResponse,
            createdAt: event.createdAt,
        };
    }
}
