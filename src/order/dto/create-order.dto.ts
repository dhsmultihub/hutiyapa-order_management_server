import { IsString, IsNumber, IsArray, IsObject, IsOptional, IsEmail, IsPhoneNumber, Min, Max, ValidateNested, IsEnum, IsUUID, IsPositive, IsNotEmpty, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Address DTO
export class AddressDto {
  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ description: 'Company name', example: 'Acme Corp' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({ description: 'Address line 1', example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  address1: string;

  @ApiPropertyOptional({ description: 'Address line 2', example: 'Apt 4B' })
  @IsString()
  @IsOptional()
  address2?: string;

  @ApiProperty({ description: 'City', example: 'Mumbai' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State/Province', example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code', example: '400001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ description: 'Country', example: 'India' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+91-9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

// Order Item DTO
export class OrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 'PROD-001' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID', example: 'VAR-001-RED-M' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ description: 'Product SKU', example: 'TSHIRT-RED-M' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Product name', example: 'Premium Cotton T-Shirt' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Product description', example: '100% cotton, comfortable fit' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Quantity', example: 2, minimum: 1 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(1000)
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: 999.00, minimum: 0 })
  @IsNumber()
  @IsPositive()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item', example: 1998.00, minimum: 0 })
  @IsNumber()
  @IsPositive()
  @Min(0)
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 18.0, minimum: 0, maximum: 100 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', example: { color: 'Red', size: 'M' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// Payment Method DTO
export class PaymentMethodDto {
  @ApiProperty({ description: 'Payment method', example: 'credit_card', enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod'] })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod'])
  method: string;

  @ApiProperty({ description: 'Payment gateway', example: 'razorpay', enum: ['razorpay', 'stripe', 'paypal'] })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['razorpay', 'stripe', 'paypal'])
  gateway: string;

  @ApiPropertyOptional({ description: 'Payment details', example: { cardNumber: '****1234' } })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

// Main Create Order DTO
export class CreateOrderDto {
  @ApiProperty({ description: 'User ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Shipping address', type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsObject()
  shippingAddress: AddressDto;

  @ApiProperty({ description: 'Billing address', type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsObject()
  billingAddress: AddressDto;

  @ApiProperty({ description: 'Order items', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  orderItems: OrderItemDto[];

  @ApiProperty({ description: 'Payment method', type: PaymentMethodDto })
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  @IsObject()
  paymentMethod: PaymentMethodDto;

  @ApiPropertyOptional({ description: 'Currency code', example: 'INR', default: 'INR' })
  @IsString()
  @IsOptional()
  @IsEnum(['INR', 'USD', 'EUR', 'GBP'])
  currency?: string;

  @ApiPropertyOptional({ description: 'Order notes', example: 'Please handle with care' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Apply same address for billing', example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  useSameAddressForBilling?: boolean;

  // Validation method
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate order items
    if (!this.orderItems || this.orderItems.length === 0) {
      errors.push('At least one order item is required');
    }

    // Validate total amount calculation
    if (this.orderItems) {
      const calculatedTotal = this.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const expectedTotal = this.orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      if (Math.abs(calculatedTotal - expectedTotal) > 0.01) {
        errors.push('Total price calculation mismatch in order items');
      }
    }

    // Validate addresses
    if (this.shippingAddress && this.billingAddress) {
      const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'postalCode', 'country'];
      
      for (const field of requiredFields) {
        if (!this.shippingAddress[field]) {
          errors.push(`Shipping address ${field} is required`);
        }
        if (!this.billingAddress[field]) {
          errors.push(`Billing address ${field} is required`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Helper method to set same address for billing
  setSameAddressForBilling(): void {
    if (this.useSameAddressForBilling && this.shippingAddress) {
      this.billingAddress = { ...this.shippingAddress };
    }
  }
}
