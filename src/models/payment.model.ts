import { Prisma, Payment as PrismaPayment, PaymentStatus } from '@prisma/client';
import { PaymentData, Payment as PaymentType } from '../types/order.types';

export class PaymentModel {
    constructor(
        public id: string,
        public orderId: string,
        public paymentMethod: string,
        public paymentGateway: string,
        public transactionId?: string,
        public amount: number = 0,
        public currency: string = 'INR',
        public status: PaymentStatus = 'PENDING',
        public gatewayResponse?: Record<string, any>,
        public processedAt?: Date,
        public createdAt: Date = new Date()
    ) { }

    // Factory method to create from Prisma payment
    static fromPrisma(payment: PrismaPayment): PaymentModel {
        return new PaymentModel(
            payment.id.toString(),
            payment.orderId.toString(),
            payment.paymentMethod,
            payment.paymentGateway,
            payment.transactionId || undefined,
            payment.amount.toNumber(),
            payment.currency,
            payment.status,
            payment.gatewayResponse as Record<string, any> || undefined,
            payment.processedAt || undefined,
            payment.createdAt
        );
    }

    // Convert to Prisma create input
    toPrismaCreate(): Prisma.PaymentCreateInput {
        return {
            paymentMethod: this.paymentMethod,
            paymentGateway: this.paymentGateway,
            transactionId: this.transactionId,
            amount: this.amount,
            currency: this.currency,
            status: this.status,
            gatewayResponse: this.gatewayResponse,
            processedAt: this.processedAt,
            order: {
                connect: { id: BigInt(this.orderId) }
            }
        };
    }

    // Convert to Prisma update input
    toPrismaUpdate(): Prisma.PaymentUpdateInput {
        return {
            paymentMethod: this.paymentMethod,
            paymentGateway: this.paymentGateway,
            transactionId: this.transactionId,
            amount: this.amount,
            currency: this.currency,
            status: this.status,
            gatewayResponse: this.gatewayResponse,
            processedAt: this.processedAt,
        };
    }

    // Convert to response DTO
    toResponseDto(): PaymentType {
        return {
            id: this.id,
            orderId: this.orderId,
            paymentMethod: this.paymentMethod,
            paymentGateway: this.paymentGateway,
            transactionId: this.transactionId,
            amount: this.amount,
            currency: this.currency,
            status: this.status,
            gatewayResponse: this.gatewayResponse,
            processedAt: this.processedAt,
            createdAt: this.createdAt,
        };
    }

    // Create from DTO
    static fromData(data: PaymentData, orderId: string): PaymentModel {
        return new PaymentModel(
            '', // Will be set by database
            orderId,
            data.paymentMethod,
            data.paymentGateway,
            data.transactionId,
            data.amount,
            data.currency || 'INR',
            'PENDING',
            data.gatewayResponse
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

    isRefunded(): boolean {
        return this.status === 'REFUNDED';
    }

    canBeProcessed(): boolean {
        return this.status === 'PENDING';
    }

    canBeRefunded(): boolean {
        return this.status === 'COMPLETED';
    }

    canBeCancelled(): boolean {
        return ['PENDING', 'PROCESSING'].includes(this.status);
    }

    // Status transition methods
    markProcessing(): void {
        if (!this.canBeProcessed()) {
            throw new Error('Payment cannot be processed in current status');
        }
        this.status = 'PROCESSING';
        (this as any).updatedAt = new Date();
    }

    markCompleted(transactionId?: string, gatewayResponse?: Record<string, any>): void {
        if (this.status !== 'PROCESSING') {
            throw new Error('Payment can only be completed from PROCESSING status');
        }
        this.status = 'COMPLETED';
        this.processedAt = new Date();
        if (transactionId) this.transactionId = transactionId;
        if (gatewayResponse) this.gatewayResponse = gatewayResponse;
    }

    markFailed(gatewayResponse?: Record<string, any>): void {
        if (!['PENDING', 'PROCESSING'].includes(this.status)) {
            throw new Error('Payment can only be marked as failed from PENDING or PROCESSING status');
        }
        this.status = 'FAILED';
        this.processedAt = new Date();
        if (gatewayResponse) this.gatewayResponse = gatewayResponse;
    }

    markCancelled(): void {
        if (!this.canBeCancelled()) {
            throw new Error('Payment cannot be cancelled in current status');
        }
        this.status = 'CANCELLED';
        this.processedAt = new Date();
    }

    markRefunded(): void {
        if (!this.canBeRefunded()) {
            throw new Error('Payment can only be refunded from COMPLETED status');
        }
        this.status = 'REFUNDED';
    }

    // Validation methods
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.orderId) errors.push('Order ID is required');
        if (!this.paymentMethod) errors.push('Payment method is required');
        if (!this.paymentGateway) errors.push('Payment gateway is required');
        if (this.amount <= 0) errors.push('Amount must be greater than 0');
        if (!this.currency) errors.push('Currency is required');

        // Validate currency format (3 characters)
        if (this.currency && this.currency.length !== 3) {
            errors.push('Currency must be a 3-character code (e.g., INR, USD)');
        }

        // Validate transaction ID format if provided
        if (this.transactionId && this.transactionId.length < 3) {
            errors.push('Transaction ID must be at least 3 characters long');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Payment processing methods
    processPayment(gatewayResponse: Record<string, any>): void {
        this.markProcessing();
        this.gatewayResponse = gatewayResponse;
    }

    completePayment(transactionId: string, gatewayResponse: Record<string, any>): void {
        this.markCompleted(transactionId, gatewayResponse);
    }

    failPayment(gatewayResponse: Record<string, any>): void {
        this.markFailed(gatewayResponse);
    }

    // Refund methods
    initiateRefund(): void {
        if (!this.canBeRefunded()) {
            throw new Error('Payment cannot be refunded in current status');
        }
        // Refund logic would be implemented here
        this.markRefunded();
    }

    // Gateway response methods
    setGatewayResponse(response: Record<string, any>): void {
        this.gatewayResponse = response;
    }

    getGatewayResponse(): Record<string, any> | undefined {
        return this.gatewayResponse;
    }

    // Amount methods
    getAmount(): number {
        return this.amount;
    }

    getCurrency(): string {
        return this.currency;
    }

    getFormattedAmount(): string {
        return `${this.currency} ${this.amount.toFixed(2)}`;
    }

    // Transaction methods
    setTransactionId(transactionId: string): void {
        this.transactionId = transactionId;
    }

    getTransactionId(): string | undefined {
        return this.transactionId;
    }

    // Serialization methods
    toJSON(): Record<string, any> {
        return {
            id: this.id,
            orderId: this.orderId,
            paymentMethod: this.paymentMethod,
            paymentGateway: this.paymentGateway,
            transactionId: this.transactionId,
            amount: this.amount,
            currency: this.currency,
            status: this.status,
            gatewayResponse: this.gatewayResponse,
            processedAt: this.processedAt,
            createdAt: this.createdAt,
        };
    }

    static fromJSON(data: Record<string, any>): PaymentModel {
        return new PaymentModel(
            data.id,
            data.orderId,
            data.paymentMethod,
            data.paymentGateway,
            data.transactionId,
            data.amount,
            data.currency,
            data.status,
            data.gatewayResponse,
            data.processedAt ? new Date(data.processedAt) : undefined,
            new Date(data.createdAt)
        );
    }

    // Helper method for updatedAt (needed for status transitions)
    private get updatedAt(): Date {
        return new Date();
    }
}
