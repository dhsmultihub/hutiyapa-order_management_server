import { Prisma, OrderItem as PrismaOrderItem } from '@prisma/client';
import { OrderItemData, OrderItem as OrderItemType } from '../types/order.types';

export class OrderItemModel {
    constructor(
        public id: string,
        public orderId: string,
        public productId: string,
        public variantId?: string,
        public sku: string = '',
        public name: string = '',
        public description?: string,
        public quantity: number = 0,
        public unitPrice: number = 0,
        public totalPrice: number = 0,
        public taxRate: number = 0,
        public metadata?: Record<string, any>,
        public createdAt: Date = new Date()
    ) { }

    // Factory method to create from Prisma order item
    static fromPrisma(orderItem: PrismaOrderItem): OrderItemModel {
        return new OrderItemModel(
            orderItem.id.toString(),
            orderItem.orderId.toString(),
            orderItem.productId,
            orderItem.variantId || undefined,
            orderItem.sku,
            orderItem.name,
            orderItem.description || undefined,
            orderItem.quantity,
            orderItem.unitPrice.toNumber(),
            orderItem.totalPrice.toNumber(),
            orderItem.taxRate.toNumber(),
            orderItem.metadata as Record<string, any> || undefined,
            orderItem.createdAt
        );
    }

    // Convert to Prisma create input
    toPrismaCreate(): Prisma.OrderItemCreateInput {
        return {
            productId: this.productId,
            variantId: this.variantId,
            sku: this.sku,
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            unitPrice: this.unitPrice,
            totalPrice: this.totalPrice,
            taxRate: this.taxRate,
            metadata: this.metadata,
            order: {
                connect: { id: BigInt(this.orderId) }
            }
        };
    }

    // Convert to Prisma update input
    toPrismaUpdate(): Prisma.OrderItemUpdateInput {
        return {
            productId: this.productId,
            variantId: this.variantId,
            sku: this.sku,
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            unitPrice: this.unitPrice,
            totalPrice: this.totalPrice,
            taxRate: this.taxRate,
            metadata: this.metadata,
        };
    }

    // Convert to response DTO
    toResponseDto(): OrderItemType {
        return {
            id: this.id,
            orderId: this.orderId,
            productId: this.productId,
            variantId: this.variantId,
            sku: this.sku,
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            unitPrice: this.unitPrice,
            totalPrice: this.totalPrice,
            taxRate: this.taxRate,
            metadata: this.metadata,
            createdAt: this.createdAt,
        };
    }

    // Create from DTO
    static fromData(data: OrderItemData, orderId: string): OrderItemModel {
        return new OrderItemModel(
            '', // Will be set by database
            orderId,
            data.productId,
            data.variantId,
            data.sku,
            data.name,
            data.description,
            data.quantity,
            data.unitPrice,
            data.totalPrice,
            data.taxRate || 0,
            data.metadata
        );
    }

    // Business logic methods
    calculateTotalPrice(): number {
        return this.quantity * this.unitPrice;
    }

    calculateTaxAmount(): number {
        return this.totalPrice * (this.taxRate / 100);
    }

    calculateTotalWithTax(): number {
        return this.totalPrice + this.calculateTaxAmount();
    }

    // Validation methods
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.productId) errors.push('Product ID is required');
        if (!this.sku) errors.push('SKU is required');
        if (!this.name) errors.push('Product name is required');
        if (this.quantity <= 0) errors.push('Quantity must be greater than 0');
        if (this.unitPrice < 0) errors.push('Unit price cannot be negative');
        if (this.totalPrice < 0) errors.push('Total price cannot be negative');
        if (this.taxRate < 0 || this.taxRate > 100) errors.push('Tax rate must be between 0 and 100');

        // Validate that total price matches quantity * unit price
        const expectedTotal = this.calculateTotalPrice();
        if (Math.abs(this.totalPrice - expectedTotal) > 0.01) {
            errors.push(`Total price (${this.totalPrice}) does not match quantity (${this.quantity}) × unit price (${this.unitPrice})`);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Update methods
    updateQuantity(quantity: number): void {
        if (quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        this.quantity = quantity;
        this.totalPrice = this.calculateTotalPrice();
    }

    updateUnitPrice(unitPrice: number): void {
        if (unitPrice < 0) {
            throw new Error('Unit price cannot be negative');
        }
        this.unitPrice = unitPrice;
        this.totalPrice = this.calculateTotalPrice();
    }

    updateTaxRate(taxRate: number): void {
        if (taxRate < 0 || taxRate > 100) {
            throw new Error('Tax rate must be between 0 and 100');
        }
        this.taxRate = taxRate;
    }

    // Serialization methods
    toJSON(): Record<string, any> {
        return {
            id: this.id,
            orderId: this.orderId,
            productId: this.productId,
            variantId: this.variantId,
            sku: this.sku,
            name: this.name,
            description: this.description,
            quantity: this.quantity,
            unitPrice: this.unitPrice,
            totalPrice: this.totalPrice,
            taxRate: this.taxRate,
            metadata: this.metadata,
            createdAt: this.createdAt,
        };
    }

    static fromJSON(data: Record<string, any>): OrderItemModel {
        return new OrderItemModel(
            data.id,
            data.orderId,
            data.productId,
            data.variantId,
            data.sku,
            data.name,
            data.description,
            data.quantity,
            data.unitPrice,
            data.totalPrice,
            data.taxRate,
            data.metadata,
            new Date(data.createdAt)
        );
    }
}
