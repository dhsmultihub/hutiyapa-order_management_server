import { IsString, IsNumber, IsOptional, IsEnum, IsEmail, IsObject, IsNotEmpty, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    UPI = 'upi',
    NET_BANKING = 'net_banking',
    WALLET = 'wallet',
    COD = 'cod',
}

export enum PaymentGateway {
    RAZORPAY = 'razorpay',
    STRIPE = 'stripe',
    PAYPAL = 'paypal',
}

export class PaymentRequestDto {
    @ApiProperty({ description: 'Order ID', example: '1' })
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({ description: 'Payment amount', example: 2999.00, minimum: 0.01 })
    @IsNumber()
    @IsPositive()
    @Min(0.01)
    amount: number;

    @ApiProperty({ description: 'Currency code', example: 'INR', enum: ['INR', 'USD', 'EUR'] })
    @IsString()
    @IsEnum(['INR', 'USD', 'EUR'])
    currency: string;

    @ApiProperty({ description: 'Payment method', example: 'credit_card', enum: PaymentMethod })
    @IsString()
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({ description: 'Payment gateway', example: 'razorpay', enum: PaymentGateway })
    @IsString()
    @IsEnum(PaymentGateway)
    paymentGateway: PaymentGateway;

    @ApiProperty({ description: 'Customer ID', example: '1' })
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @ApiProperty({ description: 'Customer email', example: 'customer@example.com' })
    @IsString()
    @IsEmail()
    customerEmail: string;

    @ApiPropertyOptional({ description: 'Customer phone', example: '+91-9876543210' })
    @IsString()
    @IsOptional()
    customerPhone?: string;

    @ApiPropertyOptional({ description: 'Payment description', example: 'Order payment for ORD-2024-001' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Additional metadata', example: { source: 'web', device: 'mobile' } })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Return URL after payment', example: 'https://example.com/payment/success' })
    @IsString()
    @IsOptional()
    returnUrl?: string;

    @ApiPropertyOptional({ description: 'Cancel URL for payment', example: 'https://example.com/payment/cancel' })
    @IsString()
    @IsOptional()
    cancelUrl?: string;

    // Validation method
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (this.amount <= 0) {
            errors.push('Amount must be greater than 0');
        }

        if (this.currency !== 'INR' && this.paymentGateway === PaymentGateway.RAZORPAY) {
            errors.push('Razorpay only supports INR currency');
        }

        if (this.paymentMethod === PaymentMethod.COD && this.paymentGateway !== PaymentGateway.RAZORPAY) {
            errors.push('COD is only supported with Razorpay gateway');
        }

        if (this.returnUrl && !this.isValidUrl(this.returnUrl)) {
            errors.push('Invalid return URL format');
        }

        if (this.cancelUrl && !this.isValidUrl(this.cancelUrl)) {
            errors.push('Invalid cancel URL format');
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
}
