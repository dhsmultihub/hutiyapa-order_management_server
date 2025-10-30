import { IsString, IsEnum, IsOptional, IsObject, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
    ORDER_CREATED = 'ORDER_CREATED',
    ORDER_UPDATED = 'ORDER_UPDATED',
    ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    SHIPMENT_CREATED = 'SHIPMENT_CREATED',
    SHIPMENT_IN_TRANSIT = 'SHIPMENT_IN_TRANSIT',
    SHIPMENT_DELIVERED = 'SHIPMENT_DELIVERED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    REFUND_PROCESSED = 'REFUND_PROCESSED',
    SUPPORT_TICKET_CREATED = 'SUPPORT_TICKET_CREATED',
    SUPPORT_TICKET_UPDATED = 'SUPPORT_TICKET_UPDATED',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    PROMOTIONAL = 'PROMOTIONAL',
}

export enum NotificationChannel {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    PUSH = 'PUSH',
    IN_APP = 'IN_APP',
    WEBHOOK = 'WEBHOOK',
}

export enum NotificationPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export class CreateNotificationDto {
    @ApiProperty({ description: 'User ID to send notification to', example: '1' })
    @IsString()
    userId: string;

    @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
    @IsEnum(NotificationType)
    type: NotificationType;

    @ApiProperty({ description: 'Notification title', example: 'Order Status Updated' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Notification message', example: 'Your order #12345 has been shipped' })
    @IsString()
    message: string;

    @ApiProperty({ enum: NotificationChannel, isArray: true, description: 'Channels to send notification through' })
    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    channels: NotificationChannel[];

    @ApiProperty({ enum: NotificationPriority, description: 'Notification priority', default: NotificationPriority.MEDIUM })
    @IsEnum(NotificationPriority)
    @IsOptional()
    priority?: NotificationPriority = NotificationPriority.MEDIUM;

    @ApiPropertyOptional({ description: 'Additional data for the notification' })
    @IsObject()
    @IsOptional()
    data?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Scheduled delivery time' })
    @IsDateString()
    @IsOptional()
    scheduledAt?: string;

    @ApiPropertyOptional({ description: 'Expiration time for the notification' })
    @IsDateString()
    @IsOptional()
    expiresAt?: string;
}

export class NotificationResponseDto {
    @ApiProperty({ description: 'Notification ID', example: '1' })
    id: string;

    @ApiProperty({ description: 'User ID', example: '1' })
    userId: string;

    @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
    type: NotificationType;

    @ApiProperty({ description: 'Notification title' })
    title: string;

    @ApiProperty({ description: 'Notification message' })
    message: string;

    @ApiProperty({ enum: NotificationChannel, isArray: true, description: 'Channels used' })
    channels: NotificationChannel[];

    @ApiProperty({ enum: NotificationPriority, description: 'Notification priority' })
    priority: NotificationPriority;

    @ApiProperty({ description: 'Additional data' })
    data?: Record<string, any>;

    @ApiProperty({ description: 'Whether notification was read', example: false })
    isRead: boolean;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Read timestamp' })
    readAt?: Date;

    @ApiProperty({ description: 'Scheduled delivery time' })
    scheduledAt?: Date;

    @ApiProperty({ description: 'Expiration time' })
    expiresAt?: Date;
}

export class NotificationPreferencesDto {
    @ApiProperty({ description: 'User ID', example: '1' })
    userId: string;

    @ApiProperty({ description: 'Email notifications enabled', example: true })
    emailEnabled: boolean;

    @ApiProperty({ description: 'SMS notifications enabled', example: false })
    smsEnabled: boolean;

    @ApiProperty({ description: 'Push notifications enabled', example: true })
    pushEnabled: boolean;

    @ApiProperty({ description: 'In-app notifications enabled', example: true })
    inAppEnabled: boolean;

    @ApiProperty({ description: 'Notification types preferences' })
    typePreferences: Record<NotificationType, boolean>;

    @ApiProperty({ description: 'Quiet hours start time', example: '22:00' })
    quietHoursStart?: string;

    @ApiProperty({ description: 'Quiet hours end time', example: '08:00' })
    quietHoursEnd?: string;

    @ApiProperty({ description: 'Timezone', example: 'UTC' })
    timezone?: string;
}

export class UpdateNotificationPreferencesDto {
    @ApiPropertyOptional({ description: 'Email notifications enabled' })
    @IsBoolean()
    @IsOptional()
    emailEnabled?: boolean;

    @ApiPropertyOptional({ description: 'SMS notifications enabled' })
    @IsBoolean()
    @IsOptional()
    smsEnabled?: boolean;

    @ApiPropertyOptional({ description: 'Push notifications enabled' })
    @IsBoolean()
    @IsOptional()
    pushEnabled?: boolean;

    @ApiPropertyOptional({ description: 'In-app notifications enabled' })
    @IsBoolean()
    @IsOptional()
    inAppEnabled?: boolean;

    @ApiPropertyOptional({ description: 'Notification types preferences' })
    @IsObject()
    @IsOptional()
    typePreferences?: Record<NotificationType, boolean>;

    @ApiPropertyOptional({ description: 'Quiet hours start time' })
    @IsString()
    @IsOptional()
    quietHoursStart?: string;

    @ApiPropertyOptional({ description: 'Quiet hours end time' })
    @IsString()
    @IsOptional()
    quietHoursEnd?: string;

    @ApiPropertyOptional({ description: 'Timezone' })
    @IsString()
    @IsOptional()
    timezone?: string;
}

export class NotificationQueryDto {
    @ApiPropertyOptional({ description: 'User ID to filter by', example: '1' })
    @IsString()
    @IsOptional()
    userId?: string;

    @ApiPropertyOptional({ enum: NotificationType, description: 'Filter by notification type' })
    @IsEnum(NotificationType)
    @IsOptional()
    type?: NotificationType;

    @ApiPropertyOptional({ description: 'Filter by read status' })
    @IsBoolean()
    @IsOptional()
    isRead?: boolean;

    @ApiPropertyOptional({ description: 'Page number', example: 1 })
    @IsString()
    @IsOptional()
    page?: string = '1';

    @ApiPropertyOptional({ description: 'Items per page', example: 20 })
    @IsString()
    @IsOptional()
    limit?: string = '20';
}
