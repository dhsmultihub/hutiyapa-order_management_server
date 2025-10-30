import { IsString, IsNumber, IsOptional, IsObject, IsNotEmpty, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RefundReason {
    CUSTOMER_REQUEST = 'customer_request',
    PRODUCT_DEFECT = 'product_defect',
    WRONG_ITEM = 'wrong_item',
    NOT_AS_DESCRIBED = 'not_as_described',
    DAMAGED_IN_SHIPPING = 'damaged_in_shipping',
    DUPLICATE_PAYMENT = 'duplicate_payment',
    FRAUD = 'fraud',
    OTHER = 'other',
}

export class RefundRequestDto {
    @ApiProperty({ description: 'Payment ID to refund', example: '1' })
    @IsString()
    @IsNotEmpty()
    paymentId: string;

    @ApiProperty({ description: 'Refund amount', example: 999.00, minimum: 0.01 })
    @IsNumber()
    @IsPositive()
    @Min(0.01)
    amount: number;

    @ApiProperty({ description: 'Refund reason', example: 'product_defect', enum: RefundReason })
    @IsString()
    @IsNotEmpty()
    reason: RefundReason;

    @ApiPropertyOptional({ description: 'Additional notes for refund', example: 'Customer reported stitching issue' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({ description: 'Additional metadata', example: { processed_by: 'admin', ticket_id: 'TKT-001' } })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Whether to notify customer', example: true, default: true })
    @IsOptional()
    notifyCustomer?: boolean = true;

    // Validation method
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (this.amount <= 0) {
            errors.push('Refund amount must be greater than 0');
        }

        if (this.amount > 100000) {
            errors.push('Refund amount cannot exceed 100,000');
        }

        if (!Object.values(RefundReason).includes(this.reason)) {
            errors.push('Invalid refund reason');
        }

        if (this.notes && this.notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
