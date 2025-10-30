import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ShipmentRequestDto } from '../dto/shipment-request.dto';
import { ShipmentResponseDto } from '../dto/shipment-response.dto';
import { ShippingCarrier } from '../carriers/shipping-carrier.interface';
import { BlueDartCarrier } from '../carriers/blue-dart.carrier';
import { FedExCarrier } from '../carriers/fedex.carrier';
import { DHLCarrier } from '../carriers/dhl.carrier';

@Injectable()
export class FulfillmentService {
    private readonly logger = new Logger(FulfillmentService.name);
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

    async createShipment(request: ShipmentRequestDto): Promise<ShipmentResponseDto> {
        this.logger.log(`Creating shipment for order ${request.orderId}`);

        // Validate request
        const validation = request.validate();
        if (!validation.isValid) {
            throw new BadRequestException(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Check if order exists and is ready for fulfillment
        const order = await this.prisma.order.findUnique({
            where: { id: BigInt(request.orderId) },
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${request.orderId} not found`);
        }

        if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
            throw new BadRequestException('Order must be confirmed or processing to create shipment');
        }

        if (order.paymentStatus !== 'COMPLETED') {
            throw new BadRequestException('Order payment must be completed before creating shipment');
        }

        // Get shipping carrier
        const carrier = this.carriers.get(request.carrier);
        if (!carrier) {
            throw new BadRequestException(`Unsupported shipping carrier: ${request.carrier}`);
        }

        try {
            // Create shipment through carrier
            const carrierResponse = await carrier.createShipment({
                orderId: request.orderId,
                orderNumber: request.orderNumber,
                recipientName: request.recipientName,
                recipientPhone: request.recipientPhone,
                recipientEmail: request.recipientEmail,
                shippingAddress: request.shippingAddress,
                packageDetails: request.packageDetails,
                serviceType: request.serviceType,
                specialInstructions: request.specialInstructions,
            });

            if (!carrierResponse.success) {
                throw new BadRequestException(carrierResponse.error || 'Shipment creation failed');
            }

            // Create shipment record
            const shipment = await this.prisma.shipment.create({
                data: {
                    orderId: BigInt(request.orderId),
                    trackingNumber: carrierResponse.trackingNumber,
                    carrier: request.carrier,
                    serviceType: request.serviceType,
                    status: 'PENDING',
                    shippedAt: new Date(),
                    estimatedDelivery: carrierResponse.estimatedDelivery,
                    trackingUrl: carrierResponse.trackingUrl,
                },
            });

            // Update order status to shipped
            await this.prisma.order.update({
                where: { id: BigInt(request.orderId) },
                data: {
                    status: 'SHIPPED',
                    fulfillmentStatus: 'FULFILLED',
                    shippedAt: new Date(),
                },
            });

            this.logger.log(`Shipment created with ID ${shipment.id}`);

            return this.mapShipmentToResponseDto(shipment);
        } catch (error) {
            this.logger.error('Shipment creation failed:', error);
            throw error;
        }
    }

    async getShipment(shipmentId: string): Promise<ShipmentResponseDto> {
        this.logger.log(`Getting shipment ${shipmentId}`);

        const shipment = await this.prisma.shipment.findUnique({
            where: { id: BigInt(shipmentId) },
        });

        if (!shipment) {
            throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }

        return this.mapShipmentToResponseDto(shipment);
    }

    async getShipmentsByOrder(orderId: string): Promise<ShipmentResponseDto[]> {
        this.logger.log(`Getting shipments for order ${orderId}`);

        const shipments = await this.prisma.shipment.findMany({
            where: { orderId: BigInt(orderId) },
            orderBy: { createdAt: 'desc' },
        });

        return shipments.map(shipment => this.mapShipmentToResponseDto(shipment));
    }

    async updateShipmentStatus(shipmentId: string, status: string): Promise<ShipmentResponseDto> {
        this.logger.log(`Updating shipment ${shipmentId} status to ${status}`);

        const shipment = await this.prisma.shipment.findUnique({
            where: { id: BigInt(shipmentId) },
        });

        if (!shipment) {
            throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }

        const updateData: any = { status };

        if (status === 'DELIVERED') {
            updateData.deliveredAt = new Date();
        }

        const updatedShipment = await this.prisma.shipment.update({
            where: { id: BigInt(shipmentId) },
            data: updateData,
        });

        // Update order status if delivered
        if (status === 'DELIVERED') {
            await this.prisma.order.update({
                where: { id: shipment.orderId },
                data: {
                    status: 'DELIVERED',
                    deliveredAt: new Date(),
                },
            });
        }

        return this.mapShipmentToResponseDto(updatedShipment);
    }

    private mapShipmentToResponseDto(shipment: any): ShipmentResponseDto {
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
}
