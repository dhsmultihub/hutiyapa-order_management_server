import { Prisma, Order as PrismaOrder, OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';
import { OrderResponseDto } from '../order/dto/order-response.dto';
import { CreateOrderDto } from '../order/dto/create-order.dto';
import { UpdateOrderDto } from '../order/dto/update-order.dto';
import { OrderQueryDto } from '../order/dto/order-query.dto';

export class OrderModel {
    constructor(
        public id: string,
        public orderNumber: string,
        public userId: string,
        public status: OrderStatus,
        public paymentStatus: PaymentStatus,
        public fulfillmentStatus: FulfillmentStatus,
        public totalAmount: number,
        public subtotal: number,
        public taxAmount: number,
        public shippingAmount: number,
        public discountAmount: number,
        public currency: string,
        public shippingAddress: Record<string, any>,
        public billingAddress: Record<string, any>,
        public notes?: string,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public shippedAt?: Date,
        public deliveredAt?: Date,
        public cancelledAt?: Date
    ) { }

    // Factory method to create from Prisma order
    static fromPrisma(order: PrismaOrder): OrderModel {
        return new OrderModel(
            order.id.toString(),
            order.orderNumber,
            order.userId.toString(),
            order.status,
            order.paymentStatus,
            order.fulfillmentStatus,
            order.totalAmount.toNumber(),
            order.subtotal.toNumber(),
            order.taxAmount.toNumber(),
            order.shippingAmount.toNumber(),
            order.discountAmount.toNumber(),
            order.currency,
            order.shippingAddress as Record<string, any>,
            order.billingAddress as Record<string, any>,
            order.notes || undefined,
            order.createdAt,
            order.updatedAt,
            order.shippedAt || undefined,
            order.deliveredAt || undefined,
            order.cancelledAt || undefined
        );
    }

    // Convert to Prisma create input
    toPrismaCreate(): Prisma.OrderCreateInput {
        return {
            orderNumber: this.orderNumber,
            userId: BigInt(this.userId),
            status: this.status,
            paymentStatus: this.paymentStatus,
            fulfillmentStatus: this.fulfillmentStatus,
            totalAmount: this.totalAmount,
            subtotal: this.subtotal,
            taxAmount: this.taxAmount,
            shippingAmount: this.shippingAmount,
            discountAmount: this.discountAmount,
            currency: this.currency,
            shippingAddress: this.shippingAddress as any,
            billingAddress: this.billingAddress as any,
            notes: this.notes,
            shippedAt: this.shippedAt,
            deliveredAt: this.deliveredAt,
            cancelledAt: this.cancelledAt,
        };
    }

    // Convert to Prisma update input
    toPrismaUpdate(): Prisma.OrderUpdateInput {
        return {
            status: this.status,
            paymentStatus: this.paymentStatus,
            fulfillmentStatus: this.fulfillmentStatus,
            totalAmount: this.totalAmount,
            subtotal: this.subtotal,
            taxAmount: this.taxAmount,
            shippingAmount: this.shippingAmount,
            discountAmount: this.discountAmount,
            currency: this.currency,
            shippingAddress: this.shippingAddress as any,
            billingAddress: this.billingAddress as any,
            notes: this.notes,
            shippedAt: this.shippedAt,
            deliveredAt: this.deliveredAt,
            cancelledAt: this.cancelledAt,
            updatedAt: new Date(),
        };
    }

    // Convert to response DTO
    toResponseDto(): OrderResponseDto {
        return {
            id: this.id,
            orderNumber: this.orderNumber,
            userId: this.userId,
            status: this.status as any,
            paymentStatus: this.paymentStatus as any,
            fulfillmentStatus: this.fulfillmentStatus as any,
            totalAmount: this.totalAmount,
            subtotal: this.subtotal,
            taxAmount: this.taxAmount,
            shippingAmount: this.shippingAmount,
            discountAmount: this.discountAmount,
            currency: this.currency,
            shippingAddress: this.shippingAddress as any,
            billingAddress: this.billingAddress as any,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            shippedAt: this.shippedAt,
            deliveredAt: this.deliveredAt,
            cancelledAt: this.cancelledAt,
            orderItems: [],
            payments: [],
            shipments: [],
            returns: [],
            refunds: [],
        };
    }

    // Create from DTO
    static fromCreateDto(dto: CreateOrderDto, orderNumber: string): OrderModel {
        const subtotal = dto.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const taxAmount = dto.orderItems.reduce((sum, item) => {
            return sum + (item.totalPrice * (item.taxRate || 0) / 100);
        }, 0);
        const totalAmount = subtotal + taxAmount + (dto.orderItems.length > 0 ? 0 : 0); // Add shipping if needed

        return new OrderModel(
            '', // Will be set by database
            orderNumber,
            dto.userId,
            'PENDING',
            'PENDING',
            'UNFULFILLED',
            totalAmount,
            subtotal,
            taxAmount,
            0, // shippingAmount
            0, // discountAmount
            dto.currency || 'INR',
            dto.shippingAddress as any,
            dto.billingAddress as any,
            dto.notes
        );
    }

    // Update from DTO
    updateFromDto(dto: UpdateOrderDto): void {
        if (dto.status !== undefined) this.status = dto.status;
        if (dto.paymentStatus !== undefined) this.paymentStatus = dto.paymentStatus;
        if (dto.fulfillmentStatus !== undefined) this.fulfillmentStatus = dto.fulfillmentStatus;
        if (dto.notes !== undefined) this.notes = dto.notes;
        if (dto.shippingAddress !== undefined) this.shippingAddress = dto.shippingAddress;
        if (dto.billingAddress !== undefined) this.billingAddress = dto.billingAddress;
        this.updatedAt = new Date();
    }

    // Business logic methods
    canBeCancelled(): boolean {
        return ['PENDING', 'CONFIRMED'].includes(this.status);
    }

    canBeShipped(): boolean {
        return this.status === 'CONFIRMED' && this.paymentStatus === 'COMPLETED';
    }

    canBeDelivered(): boolean {
        return this.status === 'SHIPPED';
    }

    canBeCompleted(): boolean {
        return this.status === 'DELIVERED';
    }

    isPaid(): boolean {
        return this.paymentStatus === 'COMPLETED';
    }

    isFulfilled(): boolean {
        return this.fulfillmentStatus === 'FULFILLED';
    }

    isCancelled(): boolean {
        return this.status === 'CANCELLED';
    }

    // Status transition methods
    confirm(): void {
        if (this.status !== 'PENDING') {
            throw new Error('Order can only be confirmed from PENDING status');
        }
        this.status = 'CONFIRMED';
        this.updatedAt = new Date();
    }

    process(): void {
        if (this.status !== 'CONFIRMED') {
            throw new Error('Order can only be processed from CONFIRMED status');
        }
        this.status = 'PROCESSING';
        this.updatedAt = new Date();
    }

    ship(): void {
        if (this.status !== 'PROCESSING') {
            throw new Error('Order can only be shipped from PROCESSING status');
        }
        this.status = 'SHIPPED';
        this.fulfillmentStatus = 'FULFILLED';
        this.shippedAt = new Date();
        this.updatedAt = new Date();
    }

    deliver(): void {
        if (this.status !== 'SHIPPED') {
            throw new Error('Order can only be delivered from SHIPPED status');
        }
        this.status = 'DELIVERED';
        this.deliveredAt = new Date();
        this.updatedAt = new Date();
    }

    complete(): void {
        if (this.status !== 'DELIVERED') {
            throw new Error('Order can only be completed from DELIVERED status');
        }
        this.status = 'COMPLETED';
        this.updatedAt = new Date();
    }

    cancel(): void {
        if (!this.canBeCancelled()) {
            throw new Error('Order cannot be cancelled in current status');
        }
        this.status = 'CANCELLED';
        this.cancelledAt = new Date();
        this.updatedAt = new Date();
    }

    // Payment status methods
    markPaymentCompleted(): void {
        this.paymentStatus = 'COMPLETED';
        this.updatedAt = new Date();
    }

    markPaymentFailed(): void {
        this.paymentStatus = 'FAILED';
        this.updatedAt = new Date();
    }

    markPaymentRefunded(): void {
        this.paymentStatus = 'REFUNDED';
        this.updatedAt = new Date();
    }

    // Fulfillment status methods
    markFulfilled(): void {
        this.fulfillmentStatus = 'FULFILLED';
        this.updatedAt = new Date();
    }

    markPartiallyFulfilled(): void {
        this.fulfillmentStatus = 'PARTIALLY_FULFILLED';
        this.updatedAt = new Date();
    }

    markUnfulfilled(): void {
        this.fulfillmentStatus = 'UNFULFILLED';
        this.updatedAt = new Date();
    }

    // Validation methods
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.orderNumber) errors.push('Order number is required');
        if (!this.userId) errors.push('User ID is required');
        if (this.totalAmount <= 0) errors.push('Total amount must be greater than 0');
        if (this.subtotal <= 0) errors.push('Subtotal must be greater than 0');
        if (!this.shippingAddress) errors.push('Shipping address is required');
        if (!this.billingAddress) errors.push('Billing address is required');

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Serialization methods
    toJSON(): Record<string, any> {
        return {
            id: this.id,
            orderNumber: this.orderNumber,
            userId: this.userId,
            status: this.status,
            paymentStatus: this.paymentStatus,
            fulfillmentStatus: this.fulfillmentStatus,
            totalAmount: this.totalAmount,
            subtotal: this.subtotal,
            taxAmount: this.taxAmount,
            shippingAmount: this.shippingAmount,
            discountAmount: this.discountAmount,
            currency: this.currency,
            shippingAddress: this.shippingAddress as any,
            billingAddress: this.billingAddress as any,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            shippedAt: this.shippedAt,
            deliveredAt: this.deliveredAt,
            cancelledAt: this.cancelledAt,
        };
    }

    static fromJSON(data: Record<string, any>): OrderModel {
        return new OrderModel(
            data.id,
            data.orderNumber,
            data.userId,
            data.status,
            data.paymentStatus,
            data.fulfillmentStatus,
            data.totalAmount,
            data.subtotal,
            data.taxAmount,
            data.shippingAmount,
            data.discountAmount,
            data.currency,
            data.shippingAddress,
            data.billingAddress,
            data.notes,
            new Date(data.createdAt),
            new Date(data.updatedAt),
            data.shippedAt ? new Date(data.shippedAt) : undefined,
            data.deliveredAt ? new Date(data.deliveredAt) : undefined,
            data.cancelledAt ? new Date(data.cancelledAt) : undefined
        );
    }
}
