import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from './update-order.dto';

export class OrderQueryDto {
  @ApiPropertyOptional({ 
    description: 'Page number', 
    example: 1, 
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page', 
    example: 10, 
    minimum: 1, 
    maximum: 100,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Filter by order status', 
    example: 'COMPLETED',
    enum: OrderStatus
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by payment status', 
    example: 'COMPLETED',
    enum: PaymentStatus
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by fulfillment status', 
    example: 'FULFILLED',
    enum: FulfillmentStatus
  })
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by user ID', 
    example: '1'
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by order number', 
    example: 'ORD-2024-001'
  })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Start date for filtering (ISO string)', 
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date for filtering (ISO string)', 
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Search term for order number or notes', 
    example: 'ORD-2024'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Sort by field', 
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'totalAmount', 'orderNumber', 'status']
  })
  @IsOptional()
  @IsString()
  @IsEnum(['createdAt', 'updatedAt', 'totalAmount', 'orderNumber', 'status'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ 
    description: 'Filter by multiple order statuses', 
    example: ['COMPLETED', 'SHIPPED'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  statuses?: OrderStatus[];

  @ApiPropertyOptional({ 
    description: 'Filter by multiple payment statuses', 
    example: ['COMPLETED', 'PROCESSING'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentStatus, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  paymentStatuses?: PaymentStatus[];

  @ApiPropertyOptional({ 
    description: 'Filter by minimum total amount', 
    example: 100.00,
    minimum: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by maximum total amount', 
    example: 5000.00,
    minimum: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Include related data', 
    example: ['payments', 'shipments'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsEnum(['payments', 'shipments', 'returns', 'refunds', 'orderItems'], { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  include?: string[];

  // Helper methods
  getSkip(): number {
    return ((this.page || 1) - 1) * (this.limit || 10);
  }

  getTake(): number {
    return this.limit || 10;
  }

  getOrderBy(): Record<string, 'asc' | 'desc'> {
    return {
      [this.sortBy || 'createdAt']: this.sortOrder || 'desc'
    };
  }

  getWhereClause(): any {
    const where: any = {};

    if (this.status) {
      where.status = this.status;
    }

    if (this.statuses && this.statuses.length > 0) {
      where.status = { in: this.statuses };
    }

    if (this.paymentStatus) {
      where.paymentStatus = this.paymentStatus;
    }

    if (this.paymentStatuses && this.paymentStatuses.length > 0) {
      where.paymentStatus = { in: this.paymentStatuses };
    }

    if (this.fulfillmentStatus) {
      where.fulfillmentStatus = this.fulfillmentStatus;
    }

    if (this.userId) {
      where.userId = BigInt(this.userId);
    }

    if (this.orderNumber) {
      where.orderNumber = { contains: this.orderNumber, mode: 'insensitive' };
    }

    if (this.startDate || this.endDate) {
      where.createdAt = {};
      if (this.startDate) {
        where.createdAt.gte = new Date(this.startDate);
      }
      if (this.endDate) {
        where.createdAt.lte = new Date(this.endDate);
      }
    }

    if (this.minAmount !== undefined || this.maxAmount !== undefined) {
      where.totalAmount = {};
      if (this.minAmount !== undefined) {
        where.totalAmount.gte = this.minAmount;
      }
      if (this.maxAmount !== undefined) {
        where.totalAmount.lte = this.maxAmount;
      }
    }

    if (this.search) {
      where.OR = [
        { orderNumber: { contains: this.search, mode: 'insensitive' } },
        { notes: { contains: this.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  getIncludeClause(): any {
    const include: any = {};

    if (this.include) {
      if (this.include.includes('orderItems')) {
        include.orderItems = true;
      }
      if (this.include.includes('payments')) {
        include.payments = true;
      }
      if (this.include.includes('shipments')) {
        include.shipments = true;
      }
      if (this.include.includes('returns')) {
        include.returns = true;
      }
      if (this.include.includes('refunds')) {
        include.refunds = true;
      }
    } else {
      // Default includes
      include.orderItems = true;
    }

    return include;
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      if (start > end) {
        errors.push('Start date must be before end date');
      }
    }

    if (this.minAmount !== undefined && this.maxAmount !== undefined) {
      if (this.minAmount > this.maxAmount) {
        errors.push('Minimum amount must be less than maximum amount');
      }
    }

    if (this.page && this.page < 1) {
      errors.push('Page number must be greater than 0');
    }

    if (this.limit && (this.limit < 1 || this.limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
