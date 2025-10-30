import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OrderLifecycleDto {
    @ApiPropertyOptional({ description: 'Trigger processing pipeline', example: true })
    @IsOptional()
    @IsBoolean()
    process?: boolean;

    @ApiPropertyOptional({ description: 'Optional note for the action', example: 'Urgent fulfillment' })
    @IsOptional()
    @IsString()
    note?: string;
}


