import { IsString, IsOptional, IsEnum, IsObject, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto } from './create-order.dto';

// Order status enum
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// Fulfillment status enum
export enum FulfillmentStatus {
  UNFULFILLED = 'UNFULFILLED',
  FULFILLED = 'FULFILLED',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ 
    description: 'Order status', 
    example: 'CONFIRMED',
    enum: OrderStatus
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ 
    description: 'Payment status', 
    example: 'COMPLETED',
    enum: PaymentStatus
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ 
    description: 'Fulfillment status', 
    example: 'FULFILLED',
    enum: FulfillmentStatus
  })
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;

  @ApiPropertyOptional({ 
    description: 'Order notes', 
    example: 'Order processed successfully'
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Updated shipping address', 
    type: AddressDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsObject()
  shippingAddress?: AddressDto;

  @ApiPropertyOptional({ 
    description: 'Updated billing address', 
    type: AddressDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsObject()
  billingAddress?: AddressDto;

  @ApiPropertyOptional({ 
    description: 'Mark as shipped', 
    example: true
  })
  @IsOptional()
  @IsBoolean()
  markAsShipped?: boolean;

  @ApiPropertyOptional({ 
    description: 'Mark as delivered', 
    example: true
  })
  @IsOptional()
  @IsBoolean()
  markAsDelivered?: boolean;

  @ApiPropertyOptional({ 
    description: 'Cancel order', 
    example: false
  })
  @IsOptional()
  @IsBoolean()
  cancelOrder?: boolean;

  @ApiPropertyOptional({ 
    description: 'Reason for status change', 
    example: 'Customer requested cancellation'
  })
  @IsString()
  @IsOptional()
  reason?: string;

  // Validation method
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate status transitions
    if (this.status && this.paymentStatus && this.fulfillmentStatus) {
      // Add business logic validation here
      if (this.status === OrderStatus.CANCELLED && this.paymentStatus === PaymentStatus.COMPLETED) {
        errors.push('Cannot cancel order with completed payment without refund');
      }
    }

    // Validate boolean flags
    const booleanFlags = [this.markAsShipped, this.markAsDelivered, this.cancelOrder];
    const trueFlags = booleanFlags.filter(flag => flag === true).length;
    
    if (trueFlags > 1) {
      errors.push('Only one action can be performed at a time');
    }

    // Validate addresses if provided
    if (this.shippingAddress) {
      const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'postalCode', 'country'];
      for (const field of requiredFields) {
        if (!this.shippingAddress[field]) {
          errors.push(`Shipping address ${field} is required`);
        }
      }
    }

    if (this.billingAddress) {
      const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'postalCode', 'country'];
      for (const field of requiredFields) {
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

  // Helper method to get status update action
  getStatusUpdateAction(): string | null {
    if (this.markAsShipped) return 'SHIP';
    if (this.markAsDelivered) return 'DELIVER';
    if (this.cancelOrder) return 'CANCEL';
    if (this.status) return 'UPDATE_STATUS';
    return null;
  }

  // Helper method to check if any update is provided
  hasUpdates(): boolean {
    return !!(
      this.status ||
      this.paymentStatus ||
      this.fulfillmentStatus ||
      this.notes ||
      this.shippingAddress ||
      this.billingAddress ||
      this.markAsShipped ||
      this.markAsDelivered ||
      this.cancelOrder
    );
  }
}
