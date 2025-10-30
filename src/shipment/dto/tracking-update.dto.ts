import { IsString, IsOptional, IsEnum, IsObject, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TrackingStatus {
    PICKED_UP = 'PICKED_UP',
    IN_TRANSIT = 'IN_TRANSIT',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
    FAILED_DELIVERY = 'FAILED_DELIVERY',
    RETURNED = 'RETURNED',
    CANCELLED = 'CANCELLED',
    EXCEPTION = 'EXCEPTION',
}

export class TrackingUpdateDto {
    @ApiProperty({ description: 'Tracking number', example: 'BD1234567890' })
    @IsString()
    @IsNotEmpty()
    trackingNumber: string;

    @ApiProperty({ description: 'Tracking status', example: 'IN_TRANSIT', enum: TrackingStatus })
    @IsString()
    @IsEnum(TrackingStatus)
    status: TrackingStatus;

    @ApiPropertyOptional({ description: 'Current location', example: 'Mumbai' })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiProperty({ description: 'Update timestamp', example: '2024-01-14T15:30:00Z' })
    @IsDateString()
    timestamp: string;

    @ApiProperty({ description: 'Status description', example: 'Package in transit to destination' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ description: 'Carrier response data', example: { event_id: '12345' } })
    @IsObject()
    @IsOptional()
    carrierResponse?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Delivery attempt number', example: 1 })
    @IsOptional()
    deliveryAttempt?: number;

    @ApiPropertyOptional({ description: 'Next expected update', example: '2024-01-15T10:00:00Z' })
    @IsOptional()
    @IsDateString()
    nextUpdate?: string;

    // Validation method
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.trackingNumber || this.trackingNumber.length < 5) {
            errors.push('Invalid tracking number');
        }

        if (!Object.values(TrackingStatus).includes(this.status)) {
            errors.push('Invalid tracking status');
        }

        if (!this.description || this.description.length < 10) {
            errors.push('Description must be at least 10 characters');
        }

        if (this.deliveryAttempt && this.deliveryAttempt < 1) {
            errors.push('Delivery attempt must be at least 1');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
