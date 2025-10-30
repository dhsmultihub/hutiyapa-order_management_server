import { IsString, IsNumber, IsOptional, IsEnum, IsObject, IsNotEmpty, IsEmail, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TicketStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    PENDING_CUSTOMER = 'PENDING_CUSTOMER',
    PENDING_VENDOR = 'PENDING_VENDOR',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
    CANCELLED = 'CANCELLED',
}

export enum TicketPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum TicketCategory {
    ORDER_INQUIRY = 'ORDER_INQUIRY',
    SHIPPING_ISSUE = 'SHIPPING_ISSUE',
    PAYMENT_ISSUE = 'PAYMENT_ISSUE',
    PRODUCT_ISSUE = 'PRODUCT_ISSUE',
    RETURN_REQUEST = 'RETURN_REQUEST',
    REFUND_REQUEST = 'REFUND_REQUEST',
    TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
    GENERAL_INQUIRY = 'GENERAL_INQUIRY',
}

export enum TicketType {
    SUPPORT = 'SUPPORT',
    COMPLAINT = 'COMPLAINT',
    FEATURE_REQUEST = 'FEATURE_REQUEST',
    BUG_REPORT = 'BUG_REPORT',
}

export class CreateSupportTicketDto {
    @ApiProperty({ description: 'Order ID (if related to an order)', example: '1' })
    @IsOptional()
    @IsString()
    orderId?: string;

    @ApiProperty({ description: 'Customer ID', example: '1' })
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @ApiProperty({ description: 'Customer email', example: 'customer@example.com' })
    @IsEmail()
    customerEmail: string;

    @ApiProperty({ description: 'Customer name', example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    customerName: string;

    @ApiProperty({ description: 'Ticket subject', example: 'Order delivery issue' })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({ description: 'Ticket description', example: 'My order was not delivered on time' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'Ticket category', example: 'SHIPPING_ISSUE', enum: TicketCategory })
    @IsEnum(TicketCategory)
    category: TicketCategory;

    @ApiProperty({ description: 'Ticket type', example: 'SUPPORT', enum: TicketType })
    @IsEnum(TicketType)
    type: TicketType;

    @ApiProperty({ description: 'Ticket priority', example: 'MEDIUM', enum: TicketPriority })
    @IsEnum(TicketPriority)
    priority: TicketPriority;

    @ApiPropertyOptional({ description: 'Attachments', example: ['file1.jpg', 'file2.pdf'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    attachments?: string[];

    @ApiPropertyOptional({ description: 'Additional metadata', example: { orderNumber: 'ORD-001' } })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdateSupportTicketDto {
    @ApiPropertyOptional({ description: 'Ticket status', example: 'IN_PROGRESS', enum: TicketStatus })
    @IsEnum(TicketStatus)
    @IsOptional()
    status?: TicketStatus;

    @ApiPropertyOptional({ description: 'Ticket priority', example: 'HIGH', enum: TicketPriority })
    @IsEnum(TicketPriority)
    @IsOptional()
    priority?: TicketPriority;

    @ApiPropertyOptional({ description: 'Assigned agent ID', example: '1' })
    @IsString()
    @IsOptional()
    assignedAgentId?: string;

    @ApiPropertyOptional({ description: 'Resolution notes', example: 'Issue resolved by updating shipping address' })
    @IsString()
    @IsOptional()
    resolutionNotes?: string;

    @ApiPropertyOptional({ description: 'Internal notes', example: 'Customer contacted via phone' })
    @IsString()
    @IsOptional()
    internalNotes?: string;
}

export class SupportTicketResponseDto {
    @ApiProperty({ description: 'Ticket ID', example: '1' })
    id: string;

    @ApiProperty({ description: 'Ticket number', example: 'TKT-2024-001' })
    ticketNumber: string;

    @ApiProperty({ description: 'Order ID', example: '1' })
    orderId?: string;

    @ApiProperty({ description: 'Customer ID', example: '1' })
    customerId: string;

    @ApiProperty({ description: 'Customer email', example: 'customer@example.com' })
    customerEmail: string;

    @ApiProperty({ description: 'Customer name', example: 'John Doe' })
    customerName: string;

    @ApiProperty({ description: 'Ticket subject', example: 'Order delivery issue' })
    subject: string;

    @ApiProperty({ description: 'Ticket description', example: 'My order was not delivered on time' })
    description: string;

    @ApiProperty({ description: 'Ticket category', example: 'SHIPPING_ISSUE', enum: TicketCategory })
    category: TicketCategory;

    @ApiProperty({ description: 'Ticket type', example: 'SUPPORT', enum: TicketType })
    type: TicketType;

    @ApiProperty({ description: 'Ticket priority', example: 'MEDIUM', enum: TicketPriority })
    priority: TicketPriority;

    @ApiProperty({ description: 'Ticket status', example: 'OPEN', enum: TicketStatus })
    status: TicketStatus;

    @ApiPropertyOptional({ description: 'Assigned agent ID', example: '1' })
    assignedAgentId?: string;

    @ApiPropertyOptional({ description: 'Resolution notes', example: 'Issue resolved' })
    resolutionNotes?: string;

    @ApiPropertyOptional({ description: 'Internal notes', example: 'Internal notes' })
    internalNotes?: string;

    @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated at', example: '2024-01-15T10:30:00Z' })
    updatedAt: Date;

    @ApiPropertyOptional({ description: 'Resolved at', example: '2024-01-16T14:20:00Z' })
    resolvedAt?: Date;

    @ApiPropertyOptional({ description: 'Closed at', example: '2024-01-16T14:20:00Z' })
    closedAt?: Date;
}

export class TicketCommentDto {
    @ApiProperty({ description: 'Comment ID', example: '1' })
    id: string;

    @ApiProperty({ description: 'Ticket ID', example: '1' })
    ticketId: string;

    @ApiProperty({ description: 'Commenter ID', example: '1' })
    commenterId: string;

    @ApiProperty({ description: 'Commenter type', example: 'CUSTOMER' })
    commenterType: 'CUSTOMER' | 'AGENT' | 'SYSTEM';

    @ApiProperty({ description: 'Comment text', example: 'Thank you for the update' })
    comment: string;

    @ApiProperty({ description: 'Is internal comment', example: false })
    isInternal: boolean;

    @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
    createdAt: Date;
}

export class CreateTicketCommentDto {
    @ApiProperty({ description: 'Comment text', example: 'Thank you for the update' })
    @IsString()
    @IsNotEmpty()
    comment: string;

    @ApiProperty({ description: 'Is internal comment', example: false })
    @IsOptional()
    isInternal?: boolean = false;
}

export class TicketQueryDto {
    @ApiPropertyOptional({ description: 'Customer ID filter', example: '1' })
    @IsString()
    @IsOptional()
    customerId?: string;

    @ApiPropertyOptional({ description: 'Status filter', example: 'OPEN', enum: TicketStatus })
    @IsEnum(TicketStatus)
    @IsOptional()
    status?: TicketStatus;

    @ApiPropertyOptional({ description: 'Priority filter', example: 'HIGH', enum: TicketPriority })
    @IsEnum(TicketPriority)
    @IsOptional()
    priority?: TicketPriority;

    @ApiPropertyOptional({ description: 'Category filter', example: 'SHIPPING_ISSUE', enum: TicketCategory })
    @IsEnum(TicketCategory)
    @IsOptional()
    category?: TicketCategory;

    @ApiPropertyOptional({ description: 'Assigned agent ID filter', example: '1' })
    @IsString()
    @IsOptional()
    assignedAgentId?: string;

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
