import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, ShippingCarrier } from './shipment-request.dto';
import { TrackingStatus } from './tracking-update.dto';

export class ShipmentResponseDto {
    @ApiProperty({ description: 'Shipment ID', example: '1' })
    id: string;

    @ApiProperty({ description: 'Order ID', example: '1' })
    orderId: string;

    @ApiProperty({ description: 'Tracking number', example: 'BD1234567890' })
    trackingNumber: string;

    @ApiProperty({ description: 'Shipping carrier', example: 'blue_dart', enum: ShippingCarrier })
    carrier: ShippingCarrier;

    @ApiProperty({ description: 'Service type', example: 'express', enum: ServiceType })
    serviceType: ServiceType;

    @ApiProperty({ description: 'Shipment status', example: 'IN_TRANSIT', enum: TrackingStatus })
    status: TrackingStatus;

    @ApiPropertyOptional({ description: 'Shipped at', example: '2024-01-15T10:30:00Z' })
    shippedAt?: Date;

    @ApiPropertyOptional({ description: 'Delivered at', example: '2024-01-17T14:20:00Z' })
    deliveredAt?: Date;

    @ApiPropertyOptional({ description: 'Estimated delivery', example: '2024-01-18T18:00:00Z' })
    estimatedDelivery?: Date;

    @ApiPropertyOptional({ description: 'Tracking URL', example: 'https://www.bluedart.com/track/BD1234567890' })
    trackingUrl?: string;

    @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated at', example: '2024-01-15T10:30:00Z' })
    updatedAt: Date;
}

export class TrackingEventDto {
    @ApiProperty({ description: 'Event ID', example: '1' })
    id: string;

    @ApiProperty({ description: 'Shipment ID', example: '1' })
    shipmentId: string;

    @ApiProperty({ description: 'Event status', example: 'IN_TRANSIT', enum: TrackingStatus })
    status: TrackingStatus;

    @ApiPropertyOptional({ description: 'Event location', example: 'Mumbai' })
    location?: string;

    @ApiProperty({ description: 'Event timestamp', example: '2024-01-15T10:30:00Z' })
    timestamp: Date;

    @ApiProperty({ description: 'Event description', example: 'Package in transit to destination' })
    description: string;

    @ApiPropertyOptional({ description: 'Carrier response data', example: { event_id: '12345' } })
    carrierResponse?: Record<string, any>;

    @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
    createdAt: Date;
}

export class ShippingRateDto {
    @ApiProperty({ description: 'Carrier name', example: 'blue_dart', enum: ShippingCarrier })
    carrier: ShippingCarrier;

    @ApiProperty({ description: 'Service type', example: 'express', enum: ServiceType })
    serviceType: ServiceType;

    @ApiProperty({ description: 'Service name', example: 'Blue Dart Express' })
    serviceName: string;

    @ApiProperty({ description: 'Delivery time', example: '1-2 days' })
    deliveryTime: string;

    @ApiProperty({ description: 'Shipping rate in INR', example: 200 })
    rate: number;

    @ApiProperty({ description: 'Service description', example: 'Express delivery service' })
    description: string;

    @ApiPropertyOptional({ description: 'Additional charges', example: { fuel_surcharge: 20, insurance: 50 } })
    additionalCharges?: Record<string, number>;

    @ApiProperty({ description: 'Total rate in INR', example: 270 })
    totalRate: number;
}

export class ShipmentSummaryDto {
    @ApiProperty({ description: 'Total shipments', example: 5 })
    totalShipments: number;

    @ApiProperty({ description: 'Delivered shipments', example: 3 })
    deliveredShipments: number;

    @ApiProperty({ description: 'In transit shipments', example: 1 })
    inTransitShipments: number;

    @ApiProperty({ description: 'Failed deliveries', example: 1 })
    failedDeliveries: number;

    @ApiProperty({ description: 'Average delivery time in days', example: 2.5 })
    averageDeliveryTime: number;

    @ApiProperty({ description: 'Status summary', example: { DELIVERED: 3, IN_TRANSIT: 1, FAILED_DELIVERY: 1 } })
    statusSummary: Record<string, number>;
}
