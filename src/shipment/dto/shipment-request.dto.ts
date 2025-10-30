import { IsString, IsNumber, IsOptional, IsEnum, IsObject, IsNotEmpty, IsPositive, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ShippingCarrier {
    BLUE_DART = 'blue_dart',
    FEDEX = 'fedex',
    DHL = 'dhl',
}

export enum ServiceType {
    EXPRESS = 'express',
    STANDARD = 'standard',
    ECONOMY = 'economy',
    SAME_DAY = 'same_day',
}

export class PackageDimensionsDto {
    @ApiProperty({ description: 'Package length in cm', example: 30, minimum: 1, maximum: 200 })
    @IsNumber()
    @IsPositive()
    @Min(1)
    @Max(200)
    length: number;

    @ApiProperty({ description: 'Package width in cm', example: 20, minimum: 1, maximum: 200 })
    @IsNumber()
    @IsPositive()
    @Min(1)
    @Max(200)
    width: number;

    @ApiProperty({ description: 'Package height in cm', example: 15, minimum: 1, maximum: 200 })
    @IsNumber()
    @IsPositive()
    @Min(1)
    @Max(200)
    height: number;
}

export class PackageDetailsDto {
    @ApiProperty({ description: 'Package weight in kg', example: 1.5, minimum: 0.1, maximum: 50 })
    @IsNumber()
    @IsPositive()
    @Min(0.1)
    @Max(50)
    weight: number;

    @ApiProperty({ description: 'Package dimensions', type: PackageDimensionsDto })
    @ValidateNested()
    @Type(() => PackageDimensionsDto)
    @IsObject()
    dimensions: PackageDimensionsDto;

    @ApiProperty({ description: 'Package description', example: 'Electronics - Laptop' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'Package value in INR', example: 50000, minimum: 0.01 })
    @IsNumber()
    @IsPositive()
    @Min(0.01)
    value: number;
}

export class ShipmentRequestDto {
    @ApiProperty({ description: 'Order ID', example: '1' })
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({ description: 'Order number', example: 'ORD-2024-001' })
    @IsString()
    @IsNotEmpty()
    orderNumber: string;

    @ApiProperty({ description: 'Recipient name', example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    recipientName: string;

    @ApiProperty({ description: 'Recipient phone', example: '+91-9876543210' })
    @IsString()
    @IsNotEmpty()
    recipientPhone: string;

    @ApiProperty({ description: 'Recipient email', example: 'john.doe@example.com' })
    @IsString()
    @IsNotEmpty()
    recipientEmail: string;

    @ApiProperty({ description: 'Shipping address', example: { address1: '123 Main Street', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' } })
    @IsObject()
    @IsNotEmpty()
    shippingAddress: {
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };

    @ApiProperty({ description: 'Package details', type: PackageDetailsDto })
    @ValidateNested()
    @Type(() => PackageDetailsDto)
    @IsObject()
    packageDetails: PackageDetailsDto;

    @ApiProperty({ description: 'Shipping carrier', example: 'blue_dart', enum: ShippingCarrier })
    @IsString()
    @IsEnum(ShippingCarrier)
    carrier: ShippingCarrier;

    @ApiProperty({ description: 'Service type', example: 'express', enum: ServiceType })
    @IsString()
    @IsEnum(ServiceType)
    serviceType: ServiceType;

    @ApiPropertyOptional({ description: 'Special instructions', example: 'Handle with care - Fragile' })
    @IsString()
    @IsOptional()
    specialInstructions?: string;

    @ApiPropertyOptional({ description: 'Insurance required', example: true, default: false })
    @IsOptional()
    insuranceRequired?: boolean = false;

    @ApiPropertyOptional({ description: 'Signature required', example: true, default: true })
    @IsOptional()
    signatureRequired?: boolean = true;

    // Validation method
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate package weight
        if (this.packageDetails.weight > 30) {
            errors.push('Package weight cannot exceed 30kg');
        }

        // Validate package dimensions
        const { length, width, height } = this.packageDetails.dimensions;
        const totalDimensions = length + width + height;
        if (totalDimensions > 300) {
            errors.push('Total package dimensions cannot exceed 300cm');
        }

        // Validate package value
        if (this.packageDetails.value > 100000) {
            errors.push('Package value cannot exceed ₹1,00,000');
        }

        // Validate shipping address
        const requiredAddressFields = ['address1', 'city', 'state', 'postalCode', 'country'];
        for (const field of requiredAddressFields) {
            if (!this.shippingAddress[field]) {
                errors.push(`Shipping address ${field} is required`);
            }
        }

        // Validate phone number format
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(this.recipientPhone)) {
            errors.push('Invalid phone number format');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.recipientEmail)) {
            errors.push('Invalid email format');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
