import { IsString, IsNumber, IsOptional, IsEnum, IsObject, IsNotEmpty, IsArray, ValidateNested, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReturnStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    IN_TRANSIT = 'IN_TRANSIT',
    RECEIVED = 'RECEIVED',
    PROCESSED = 'PROCESSED',
    REFUNDED = 'REFUNDED',
    CANCELLED = 'CANCELLED',
}

export enum ReturnReason {
    DEFECTIVE_PRODUCT = 'DEFECTIVE_PRODUCT',
    WRONG_ITEM = 'WRONG_ITEM',
    NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
    DAMAGED_IN_SHIPPING = 'DAMAGED_IN_SHIPPING',
    SIZE_ISSUE = 'SIZE_ISSUE',
    COLOR_ISSUE = 'COLOR_ISSUE',
    QUALITY_ISSUE = 'QUALITY_ISSUE',
    CHANGED_MIND = 'CHANGED_MIND',
    DUPLICATE_ORDER = 'DUPLICATE_ORDER',
    OTHER = 'OTHER',
}

export enum ReturnType {
    REFUND = 'REFUND',
    EXCHANGE = 'EXCHANGE',
    STORE_CREDIT = 'STORE_CREDIT',
}

export class ReturnItemDto {
    @ApiProperty({ description: 'Order item ID', example: '1' })
    @IsString()
    @IsNotEmpty()
    orderItemId: string;

    @ApiProperty({ description: 'Product ID', example: '1' })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ description: 'Product name', example: 'Laptop' })
    @IsString()
    @IsNotEmpty()
    productName: string;

    @ApiProperty({ description: 'Quantity to return', example: 1, minimum: 1 })
    @IsNumber()
    @IsPositive()
    @Min(1)
    quantity: number;

    @ApiProperty({ description: 'Unit price', example: 50000, minimum: 0.01 })
    @IsNumber()
    @IsPositive()
    @Min(0.01)
    unitPrice: number;

    @ApiProperty({ description: 'Return reason', example: 'DEFECTIVE_PRODUCT', enum: ReturnReason })
    @IsEnum(ReturnReason)
    reason: ReturnReason;

    @ApiPropertyOptional({ description: 'Additional notes', example: 'Product arrived damaged' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({ description: 'Product condition', example: 'DAMAGED' })
    @IsString()
    @IsOptional()
    condition?: string;
}

export class CreateReturnRequestDto {
    @ApiProperty({ description: 'Order ID', example: '1' })
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({ description: 'Customer ID', example: '1' })
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @ApiProperty({ description: 'Return type', example: 'REFUND', enum: ReturnType })
    @IsEnum(ReturnType)
    returnType: ReturnType;

    @ApiProperty({ description: 'Return reason', example: 'DEFECTIVE_PRODUCT', enum: ReturnReason })
    @IsEnum(ReturnReason)
    reason: ReturnReason;

    @ApiProperty({ description: 'Return items', type: [ReturnItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReturnItemDto)
    items: ReturnItemDto[];

    @ApiProperty({ description: 'Return description', example: 'Product arrived damaged and not working' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ description: 'Preferred resolution', example: 'Full refund' })
    @IsString()
    @IsOptional()
    preferredResolution?: string;

    @ApiPropertyOptional({ description: 'Attachments', example: ['damage1.jpg', 'damage2.jpg'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    attachments?: string[];

    @ApiPropertyOptional({ description: 'Additional metadata', example: { originalOrderNumber: 'ORD-001' } })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdateReturnRequestDto {
    @ApiPropertyOptional({ description: 'Return status', example: 'APPROVED', enum: ReturnStatus })
    @IsEnum(ReturnStatus)
    @IsOptional()
    status?: ReturnStatus;

    @ApiPropertyOptional({ description: 'Admin notes', example: 'Return approved after inspection' })
    @IsString()
    @IsOptional()
    adminNotes?: string;

    @ApiPropertyOptional({ description: 'Refund amount', example: 50000, minimum: 0 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    refundAmount?: number;

    @ApiPropertyOptional({ description: 'Processing notes', example: 'Refund processed via original payment method' })
    @IsString()
    @IsOptional()
    processingNotes?: string;
}

export class ReturnRequestResponseDto {
    @ApiProperty({ description: 'Return request ID', example: '1' })
    id: string;

    @ApiProperty({ description: 'Return request number', example: 'RET-2024-001' })
    returnNumber: string;

    @ApiProperty({ description: 'Order ID', example: '1' })
    orderId: string;

    @ApiProperty({ description: 'Customer ID', example: '1' })
    customerId: string;

    @ApiProperty({ description: 'Return type', example: 'REFUND', enum: ReturnType })
    returnType: ReturnType;

    @ApiProperty({ description: 'Return reason', example: 'DEFECTIVE_PRODUCT', enum: ReturnReason })
    reason: ReturnReason;

    @ApiProperty({ description: 'Return status', example: 'PENDING', enum: ReturnStatus })
    status: ReturnStatus;

    @ApiProperty({ description: 'Return description', example: 'Product arrived damaged' })
    description: string;

    @ApiProperty({ description: 'Total refund amount', example: 50000 })
    totalRefundAmount: number;

    @ApiProperty({ description: 'Return items', type: [ReturnItemDto] })
    items: ReturnItemDto[];

    @ApiPropertyOptional({ description: 'Admin notes', example: 'Return approved' })
    adminNotes?: string;

    @ApiPropertyOptional({ description: 'Processing notes', example: 'Refund processed' })
    processingNotes?: string;

    @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated at', example: '2024-01-15T10:30:00Z' })
    updatedAt: Date;

    @ApiPropertyOptional({ description: 'Processed at', example: '2024-01-16T14:20:00Z' })
    processedAt?: Date;
}

export class ReturnQueryDto {
    @ApiPropertyOptional({ description: 'Customer ID filter', example: '1' })
    @IsString()
    @IsOptional()
    customerId?: string;

    @ApiPropertyOptional({ description: 'Order ID filter', example: '1' })
    @IsString()
    @IsOptional()
    orderId?: string;

    @ApiPropertyOptional({ description: 'Status filter', example: 'PENDING', enum: ReturnStatus })
    @IsEnum(ReturnStatus)
    @IsOptional()
    status?: ReturnStatus;

    @ApiPropertyOptional({ description: 'Return type filter', example: 'REFUND', enum: ReturnType })
    @IsEnum(ReturnType)
    @IsOptional()
    returnType?: ReturnType;

    @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
    @IsNumber()
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', example: 10, minimum: 1, maximum: 100 })
    @IsNumber()
    @IsOptional()
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
    @IsString()
    @IsOptional()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({ description: 'Sort order', example: 'DESC' })
    @IsString()
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
