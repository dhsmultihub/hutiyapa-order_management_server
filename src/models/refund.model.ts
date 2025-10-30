import { Prisma, Refund as PrismaRefund, RefundStatus } from '@prisma/client';
import { RefundData, Refund as RefundType } from '../types/order.types';

export class RefundModel {
    constructor(
        public id: string,
        public orderId: string,
        public paymentId: string,
        public amount: number = 0,
        public reason: string = '',
        public status: RefundStatus = 'PENDING',
        public processedAt?: Date,
        public createdAt: Date = new Date()
    ) { }

    // Factory method to create from Prisma refund
    static fromPrisma(refund: PrismaRefund): RefundModel {
        return new RefundModel(
            refund.id.toString(),
            refund.orderId.toString(),
            refund.paymentId.toString(),
            refund.amount.toNumber(),
            refund.reason,
            refund.status,
            refund.processedAt || undefined,
            refund.createdAt
        );
    }

    // Convert to Prisma create input
    toPrismaCreate(): Prisma.RefundCreateInput {
        return {
            amount: this.amount,
            reason: this.reason,
            status: this.status,
            processedAt: this.processedAt,
            order: {
                connect: { id: BigInt(this.orderId) }
            },
            payment: {
                connect: { id: BigInt(this.paymentId) }
            }
        };
    }

    // Convert to Prisma update input
    toPrismaUpdate(): Prisma.RefundUpdateInput {
        return {
            amount: this.amount,
            reason: this.reason,
            status: this.status,
            processedAt: this.processedAt,
        };
    }

    // Convert to response DTO
    toResponseDto(): RefundType {
        return {
            id: this.id,
            orderId: this.orderId,
            paymentId: this.paymentId,
            amount: this.amount,
            reason: this.reason,
            status: this.status,
            processedAt: this.processedAt,
            createdAt: this.createdAt,
        };
    }

    // Create from DTO
    static fromData(data: RefundData, orderId: string): RefundModel {
        return new RefundModel(
            '', // Will be set by database
            orderId,
            data.paymentId,
            data.amount,
            data.reason,
            data.status,
            data.processedAt
        );
    }

    // Business logic methods
    isPending(): boolean {
        return this.status === 'PENDING';
    }

    isProcessing(): boolean {
        return this.status === 'PROCESSING';
    }

    isCompleted(): boolean {
        return this.status === 'COMPLETED';
    }

    isFailed(): boolean {
        return this.status === 'FAILED';
    }

    isCancelled(): boolean {
        return this.status === 'CANCELLED';
    }

    canBeProcessed(): boolean {
        return this.status === 'PENDING';
    }

    canBeCancelled(): boolean {
        return ['PENDING', 'PROCESSING'].includes(this.status);
    }

    canBeCompleted(): boolean {
        return this.status === 'PROCESSING';
    }

    canBeFailed(): boolean {
        return ['PENDING', 'PROCESSING'].includes(this.status);
    }

    // Status transition methods
    markProcessing(): void {
        if (!this.canBeProcessed()) {
            throw new Error('Refund cannot be processed in current status');
        }
        this.status = 'PROCESSING';
    }

    markCompleted(): void {
        if (!this.canBeCompleted()) {
            throw new Error('Refund can only be completed from PROCESSING status');
        }
        this.status = 'COMPLETED';
        this.processedAt = new Date();
    }

    markFailed(): void {
        if (!this.canBeFailed()) {
            throw new Error('Refund cannot be marked as failed in current status');
        }
        this.status = 'FAILED';
        this.processedAt = new Date();
    }

    markCancelled(): void {
        if (!this.canBeCancelled()) {
            throw new Error('Refund cannot be cancelled in current status');
        }
        this.status = 'CANCELLED';
        this.processedAt = new Date();
    }

    // Validation methods
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.orderId) errors.push('Order ID is required');
        if (!this.paymentId) errors.push('Payment ID is required');
        if (this.amount <= 0) errors.push('Amount must be greater than 0');
        if (!this.reason) errors.push('Reason is required');

        // Validate reason length
        if (this.reason && this.reason.length < 3) {
            errors.push('Reason must be at least 3 characters long');
        }

        // Validate amount precision (max 2 decimal places)
        if (this.amount && this.amount % 0.01 !== 0) {
            errors.push('Amount must have at most 2 decimal places');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Amount methods
    getAmount(): number {
        return this.amount;
    }

    setAmount(amount: number): void {
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        this.amount = amount;
    }

    getFormattedAmount(): string {
        return `INR ${this.amount.toFixed(2)}`;
    }

    // Reason methods
    getReason(): string {
        return this.reason;
    }

    setReason(reason: string): void {
        if (!reason || reason.length < 3) {
            throw new Error('Reason must be at least 3 characters long');
        }
        this.reason = reason;
    }

    // Processing methods
    process(): void {
        this.markProcessing();
    }

    complete(): void {
        this.markCompleted();
    }

    fail(): void {
        this.markFailed();
    }

    cancel(): void {
        this.markCancelled();
    }

    // Status check methods
    isProcessed(): boolean {
        return this.processedAt !== undefined;
    }

    getProcessingTime(): number | null {
        if (!this.processedAt) return null;
        return this.processedAt.getTime() - this.createdAt.getTime();
    }

    getProcessingTimeInDays(): number | null {
        const processingTime = this.getProcessingTime();
        if (!processingTime) return null;
        return processingTime / (1000 * 60 * 60 * 24);
    }

    // Serialization methods
    toJSON(): Record<string, any> {
        return {
            id: this.id,
            orderId: this.orderId,
            paymentId: this.paymentId,
            amount: this.amount,
            reason: this.reason,
            status: this.status,
            processedAt: this.processedAt,
            createdAt: this.createdAt,
        };
    }

    static fromJSON(data: Record<string, any>): RefundModel {
        return new RefundModel(
            data.id,
            data.orderId,
            data.paymentId,
            data.amount,
            data.reason,
            data.status,
            data.processedAt ? new Date(data.processedAt) : undefined,
            new Date(data.createdAt)
        );
    }
}
