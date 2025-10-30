import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentGateway } from './payment-request.dto';
import { RefundReason } from './refund-request.dto';

export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
    PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export class PaymentResponseDto {
    @ApiProperty({ description: 'Payment ID', example: '1' })
    id: string;

    @ApiProperty({ description: 'Order ID', example: '1' })
    orderId: string;

    @ApiProperty({ description: 'Payment method', example: 'credit_card', enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @ApiProperty({ description: 'Payment gateway', example: 'razorpay', enum: PaymentGateway })
    paymentGateway: PaymentGateway;

    @ApiPropertyOptional({ description: 'Transaction ID from gateway', example: 'pay_1234567890' })
    transactionId?: string;

    @ApiProperty({ description: 'Payment amount', example: 2999.00 })
    amount: number;

    @ApiProperty({ description: 'Currency', example: 'INR' })
    currency: string;

    @ApiProperty({ description: 'Payment status', example: 'COMPLETED', enum: PaymentStatus })
    status: PaymentStatus;

    @ApiPropertyOptional({ description: 'Gateway response data', example: { payment_id: 'pay_1234567890' } })
    gatewayResponse?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Payment processed at', example: '2024-01-14T15:30:00Z' })
    processedAt?: Date;

    @ApiProperty({ description: 'Created at', example: '2024-01-14T15:30:00Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated at', example: '2024-01-14T15:30:00Z' })
    updatedAt: Date;
}

export class RefundResponseDto {
    @ApiProperty({ description: 'Refund ID', example: '1' })
    id: string;

    @ApiProperty({ description: 'Order ID', example: '1' })
    orderId: string;

    @ApiProperty({ description: 'Payment ID', example: '1' })
    paymentId: string;

    @ApiProperty({ description: 'Refund amount', example: 999.00 })
    amount: number;

    @ApiProperty({ description: 'Refund reason', example: 'product_defect', enum: RefundReason })
    reason: RefundReason;

    @ApiProperty({ description: 'Refund status', example: 'COMPLETED', enum: PaymentStatus })
    status: PaymentStatus;

    @ApiPropertyOptional({ description: 'Gateway transaction ID for refund', example: 'rfnd_1234567890' })
    gatewayTransactionId?: string;

    @ApiPropertyOptional({ description: 'Gateway response data', example: { refund_id: 'rfnd_1234567890' } })
    gatewayResponse?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Refund notes', example: 'Customer reported stitching issue' })
    notes?: string;

    @ApiPropertyOptional({ description: 'Refund processed at', example: '2024-01-22T09:00:00Z' })
    processedAt?: Date;

    @ApiProperty({ description: 'Created at', example: '2024-01-22T09:00:00Z' })
    createdAt: Date;
}

export class PaymentSummaryDto {
    @ApiProperty({ description: 'Total payments', example: 1 })
    totalPayments: number;

    @ApiProperty({ description: 'Total amount paid', example: 2999.00 })
    totalAmount: number;

    @ApiProperty({ description: 'Total refunds', example: 0 })
    totalRefunds: number;

    @ApiProperty({ description: 'Total refunded amount', example: 0 })
    totalRefundedAmount: number;

    @ApiProperty({ description: 'Net amount', example: 2999.00 })
    netAmount: number;

    @ApiProperty({ description: 'Payment status summary', example: { COMPLETED: 1, PENDING: 0, FAILED: 0 } })
    statusSummary: Record<string, number>;
}
