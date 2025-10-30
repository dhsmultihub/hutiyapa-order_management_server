import { Prisma, Shipment as PrismaShipment, ShipmentStatus } from '@prisma/client';
import { ShipmentData, Shipment as ShipmentType } from '../types/order.types';

export class ShipmentModel {
    constructor(
        public id: string,
        public orderId: string,
        public trackingNumber?: string,
        public carrier: string = '',
        public serviceType?: string,
        public status: ShipmentStatus = 'PENDING',
        public shippedAt?: Date,
        public deliveredAt?: Date,
        public estimatedDelivery?: Date,
        public trackingUrl?: string,
        public createdAt: Date = new Date()
    ) { }

    // Factory method to create from Prisma shipment
    static fromPrisma(shipment: PrismaShipment): ShipmentModel {
        return new ShipmentModel(
            shipment.id.toString(),
            shipment.orderId.toString(),
            shipment.trackingNumber || undefined,
            shipment.carrier,
            shipment.serviceType || undefined,
            shipment.status,
            shipment.shippedAt || undefined,
            shipment.deliveredAt || undefined,
            shipment.estimatedDelivery || undefined,
            shipment.trackingUrl || undefined,
            shipment.createdAt
        );
    }

    // Convert to Prisma create input
    toPrismaCreate(): Prisma.ShipmentCreateInput {
        return {
            trackingNumber: this.trackingNumber,
            carrier: this.carrier,
            serviceType: this.serviceType,
            status: this.status,
            shippedAt: this.shippedAt,
            deliveredAt: this.deliveredAt,
            estimatedDelivery: this.estimatedDelivery,
            trackingUrl: this.trackingUrl,
            order: {
                connect: { id: BigInt(this.orderId) }
            }
        };
    }

    // Convert to Prisma update input
    toPrismaUpdate(): Prisma.ShipmentUpdateInput {
        return {
            trackingNumber: this.trackingNumber,
            carrier: this.carrier,
            serviceType: this.serviceType,
            status: this.status,
            shippedAt: this.shippedAt,
            deliveredAt: this.deliveredAt,
            estimatedDelivery: this.estimatedDelivery,
            trackingUrl: this.trackingUrl,
        };
    }

    // Convert to response DTO
    toResponseDto(): ShipmentType {
        return {
            id: this.id,
            orderId: this.orderId,
            trackingNumber: this.trackingNumber,
            carrier: this.carrier,
            serviceType: this.serviceType,
            status: this.status,
            shippedAt: this.shippedAt,
            deliveredAt: this.deliveredAt,
            estimatedDelivery: this.estimatedDelivery,
            trackingUrl: this.trackingUrl,
            createdAt: this.createdAt,
        };
    }

    // Create from DTO
    static fromData(data: ShipmentData, orderId: string): ShipmentModel {
        return new ShipmentModel(
            '', // Will be set by database
            orderId,
            data.trackingNumber,
            data.carrier,
            data.serviceType,
            data.status,
            data.shippedAt,
            data.deliveredAt,
            data.estimatedDelivery,
            data.trackingUrl
        );
    }

    // Business logic methods
    isPending(): boolean {
        return this.status === 'PENDING';
    }

    isShipped(): boolean {
        return this.status === 'SHIPPED';
    }

    isInTransit(): boolean {
        return this.status === 'IN_TRANSIT';
    }

    isOutForDelivery(): boolean {
        return this.status === 'OUT_FOR_DELIVERY';
    }

    isDelivered(): boolean {
        return this.status === 'DELIVERED';
    }

    isFailed(): boolean {
        return this.status === 'FAILED';
    }

    isReturned(): boolean {
        return this.status === 'RETURNED';
    }

    canBeShipped(): boolean {
        return this.status === 'PENDING';
    }

    canBeDelivered(): boolean {
        return ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(this.status);
    }

    canBeReturned(): boolean {
        return ['DELIVERED', 'FAILED'].includes(this.status);
    }

    // Status transition methods
    ship(trackingNumber?: string): void {
        if (!this.canBeShipped()) {
            throw new Error('Shipment cannot be shipped in current status');
        }
        this.status = 'SHIPPED';
        this.shippedAt = new Date();
        if (trackingNumber) this.trackingNumber = trackingNumber;
    }

    markInTransit(): void {
        if (this.status !== 'SHIPPED') {
            throw new Error('Shipment can only be marked as in transit from SHIPPED status');
        }
        this.status = 'IN_TRANSIT';
    }

    markOutForDelivery(): void {
        if (!['SHIPPED', 'IN_TRANSIT'].includes(this.status)) {
            throw new Error('Shipment can only be marked as out for delivery from SHIPPED or IN_TRANSIT status');
        }
        this.status = 'OUT_FOR_DELIVERY';
    }

    deliver(): void {
        if (!this.canBeDelivered()) {
            throw new Error('Shipment cannot be delivered in current status');
        }
        this.status = 'DELIVERED';
        this.deliveredAt = new Date();
    }

    markFailed(): void {
        if (this.status === 'DELIVERED') {
            throw new Error('Delivered shipment cannot be marked as failed');
        }
        this.status = 'FAILED';
    }

    markReturned(): void {
        if (!this.canBeReturned()) {
            throw new Error('Shipment cannot be returned in current status');
        }
        this.status = 'RETURNED';
    }

    // Tracking methods
    setTrackingNumber(trackingNumber: string): void {
        this.trackingNumber = trackingNumber;
    }

    getTrackingNumber(): string | undefined {
        return this.trackingNumber;
    }

    setTrackingUrl(trackingUrl: string): void {
        this.trackingUrl = trackingUrl;
    }

    getTrackingUrl(): string | undefined {
        return this.trackingUrl;
    }

    // Delivery estimation methods
    setEstimatedDelivery(estimatedDelivery: Date): void {
        this.estimatedDelivery = estimatedDelivery;
    }

    getEstimatedDelivery(): Date | undefined {
        return this.estimatedDelivery;
    }

    isOverdue(): boolean {
        if (!this.estimatedDelivery) return false;
        return new Date() > this.estimatedDelivery && !this.isDelivered();
    }

    getDaysUntilDelivery(): number | null {
        if (!this.estimatedDelivery) return null;
        const now = new Date();
        const diffTime = this.estimatedDelivery.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Carrier methods
    setCarrier(carrier: string): void {
        this.carrier = carrier;
    }

    getCarrier(): string {
        return this.carrier;
    }

    setServiceType(serviceType: string): void {
        this.serviceType = serviceType;
    }

    getServiceType(): string | undefined {
        return this.serviceType;
    }

    // Validation methods
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.orderId) errors.push('Order ID is required');
        if (!this.carrier) errors.push('Carrier is required');

        // Validate tracking number format if provided
        if (this.trackingNumber && this.trackingNumber.length < 3) {
            errors.push('Tracking number must be at least 3 characters long');
        }

        // Validate tracking URL format if provided
        if (this.trackingUrl && !this.isValidUrl(this.trackingUrl)) {
            errors.push('Tracking URL must be a valid URL');
        }

        // Validate estimated delivery date
        if (this.estimatedDelivery && this.estimatedDelivery < new Date()) {
            errors.push('Estimated delivery date cannot be in the past');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Status history methods
    getStatusHistory(): Array<{ status: ShipmentStatus; timestamp: Date; description: string }> {
        const history = [];

        if (this.createdAt) {
            history.push({
                status: 'PENDING',
                timestamp: this.createdAt,
                description: 'Shipment created'
            });
        }

        if (this.shippedAt) {
            history.push({
                status: 'SHIPPED',
                timestamp: this.shippedAt,
                description: 'Shipment shipped'
            });
        }

        if (this.deliveredAt) {
            history.push({
                status: 'DELIVERED',
                timestamp: this.deliveredAt,
                description: 'Shipment delivered'
            });
        }

        return history;
    }

    // Serialization methods
    toJSON(): Record<string, any> {
        return {
            id: this.id,
            orderId: this.orderId,
            trackingNumber: this.trackingNumber,
            carrier: this.carrier,
            serviceType: this.serviceType,
            status: this.status,
            shippedAt: this.shippedAt,
            deliveredAt: this.deliveredAt,
            estimatedDelivery: this.estimatedDelivery,
            trackingUrl: this.trackingUrl,
            createdAt: this.createdAt,
        };
    }

    static fromJSON(data: Record<string, any>): ShipmentModel {
        return new ShipmentModel(
            data.id,
            data.orderId,
            data.trackingNumber,
            data.carrier,
            data.serviceType,
            data.status,
            data.shippedAt ? new Date(data.shippedAt) : undefined,
            data.deliveredAt ? new Date(data.deliveredAt) : undefined,
            data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
            data.trackingUrl,
            new Date(data.createdAt)
        );
    }
}
