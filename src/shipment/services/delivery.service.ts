import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ShipmentSummaryDto } from '../dto/shipment-response.dto';

@Injectable()
export class DeliveryService {
    private readonly logger = new Logger(DeliveryService.name);

    constructor(private readonly prisma: PrismaService) { }

    async confirmDelivery(shipmentId: string, deliveryNotes?: string): Promise<void> {
        this.logger.log(`Confirming delivery for shipment ${shipmentId}`);

        const shipment = await this.prisma.shipment.findUnique({
            where: { id: BigInt(shipmentId) },
        });

        if (!shipment) {
            throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }

        if (shipment.status === 'DELIVERED') {
            throw new BadRequestException('Shipment is already marked as delivered');
        }

        try {
            // Update shipment status
            await this.prisma.shipment.update({
                where: { id: BigInt(shipmentId) },
                data: {
                    status: 'DELIVERED',
                    deliveredAt: new Date(),
                },
            });

            // Update order status
            await this.prisma.order.update({
                where: { id: shipment.orderId },
                data: {
                    status: 'DELIVERED',
                    deliveredAt: new Date(),
                },
            });

            this.logger.log(`Delivery confirmed for shipment ${shipmentId}`);
        } catch (error) {
            this.logger.error('Failed to confirm delivery:', error);
            throw error;
        }
    }

    async reportDeliveryIssue(shipmentId: string, issue: string, notes?: string): Promise<void> {
        this.logger.log(`Reporting delivery issue for shipment ${shipmentId}`);

        const shipment = await this.prisma.shipment.findUnique({
            where: { id: BigInt(shipmentId) },
        });

        if (!shipment) {
            throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }

        try {
            // Update shipment status to failed delivery
            await this.prisma.shipment.update({
                where: { id: BigInt(shipmentId) },
                data: {
                    status: 'PENDING', // Use valid status from schema
                },
            });

            // Update order status
            await this.prisma.order.update({
                where: { id: shipment.orderId },
                data: {
                    status: 'PROCESSING', // Reset to processing for retry
                },
            });

            this.logger.log(`Delivery issue reported for shipment ${shipmentId}: ${issue}`);
        } catch (error) {
            this.logger.error('Failed to report delivery issue:', error);
            throw error;
        }
    }

    async rescheduleDelivery(shipmentId: string, newDeliveryDate: Date, reason: string): Promise<void> {
        this.logger.log(`Rescheduling delivery for shipment ${shipmentId}`);

        const shipment = await this.prisma.shipment.findUnique({
            where: { id: BigInt(shipmentId) },
        });

        if (!shipment) {
            throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }

        if (shipment.status === 'DELIVERED') {
            throw new BadRequestException('Cannot reschedule delivered shipment');
        }

        try {
            // Update estimated delivery
            await this.prisma.shipment.update({
                where: { id: BigInt(shipmentId) },
                data: {
                    estimatedDelivery: newDeliveryDate,
                },
            });

            this.logger.log(`Delivery rescheduled for shipment ${shipmentId} to ${newDeliveryDate}`);
        } catch (error) {
            this.logger.error('Failed to reschedule delivery:', error);
            throw error;
        }
    }

    async getDeliverySummary(orderId?: string): Promise<ShipmentSummaryDto> {
        this.logger.log(`Getting delivery summary${orderId ? ` for order ${orderId}` : ''}`);

        const whereClause = orderId ? { orderId: BigInt(orderId) } : {};

        const shipments = await this.prisma.shipment.findMany({
            where: whereClause,
        });

        const totalShipments = shipments.length;
        const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED').length;
        const inTransitShipments = shipments.filter(s => s.status === 'IN_TRANSIT').length;
        const failedDeliveries = shipments.filter(s => s.status === 'PENDING').length; // Use valid status

        // Calculate average delivery time
        const deliveredShipmentsWithTimes = shipments.filter(s =>
            s.status === 'DELIVERED' && s.shippedAt && s.deliveredAt
        );

        const averageDeliveryTime = deliveredShipmentsWithTimes.length > 0
            ? deliveredShipmentsWithTimes.reduce((sum, s) => {
                const deliveryTime = (s.deliveredAt.getTime() - s.shippedAt.getTime()) / (1000 * 60 * 60 * 24);
                return sum + deliveryTime;
            }, 0) / deliveredShipmentsWithTimes.length
            : 0;

        // Status summary
        const statusSummary = shipments.reduce((acc, shipment) => {
            acc[shipment.status] = (acc[shipment.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalShipments,
            deliveredShipments,
            inTransitShipments,
            failedDeliveries,
            averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10, // Round to 1 decimal
            statusSummary,
        };
    }

    async getDelayedShipments(): Promise<any[]> {
        this.logger.log('Getting delayed shipments');

        const now = new Date();
        const delayedShipments = await this.prisma.shipment.findMany({
            where: {
                status: {
                    in: ['PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
                },
                estimatedDelivery: {
                    lt: now,
                },
            },
            include: {
                order: true,
            },
        });

        return delayedShipments.map(shipment => ({
            id: shipment.id.toString(),
            orderId: shipment.orderId.toString(),
            trackingNumber: shipment.trackingNumber,
            carrier: shipment.carrier,
            status: shipment.status,
            estimatedDelivery: shipment.estimatedDelivery,
            daysDelayed: Math.ceil((now.getTime() - shipment.estimatedDelivery.getTime()) / (1000 * 60 * 60 * 24)),
            orderNumber: shipment.order.orderNumber,
        }));
    }
}
