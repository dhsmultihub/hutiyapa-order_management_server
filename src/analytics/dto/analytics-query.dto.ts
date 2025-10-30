import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsArray, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalyticsTimeRange {
    TODAY = 'TODAY',
    YESTERDAY = 'YESTERDAY',
    LAST_7_DAYS = 'LAST_7_DAYS',
    LAST_30_DAYS = 'LAST_30_DAYS',
    LAST_90_DAYS = 'LAST_90_DAYS',
    THIS_MONTH = 'THIS_MONTH',
    LAST_MONTH = 'LAST_MONTH',
    THIS_QUARTER = 'THIS_QUARTER',
    LAST_QUARTER = 'LAST_QUARTER',
    THIS_YEAR = 'THIS_YEAR',
    LAST_YEAR = 'LAST_YEAR',
    CUSTOM = 'CUSTOM',
}

export enum AnalyticsGroupBy {
    HOUR = 'HOUR',
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH',
    QUARTER = 'QUARTER',
    YEAR = 'YEAR',
}

export enum ReportFormat {
    JSON = 'JSON',
    CSV = 'CSV',
    EXCEL = 'EXCEL',
    PDF = 'PDF',
}

export class AnalyticsQueryDto {
    @ApiPropertyOptional({ description: 'Start date for analytics', example: '2024-01-01' })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({ description: 'End date for analytics', example: '2024-01-31' })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Time range preset', example: 'LAST_30_DAYS', enum: AnalyticsTimeRange })
    @IsEnum(AnalyticsTimeRange)
    @IsOptional()
    timeRange?: AnalyticsTimeRange;

    @ApiPropertyOptional({ description: 'Group results by time period', example: 'DAY', enum: AnalyticsGroupBy })
    @IsEnum(AnalyticsGroupBy)
    @IsOptional()
    groupBy?: AnalyticsGroupBy;

    @ApiPropertyOptional({ description: 'Filter by order status', example: ['COMPLETED', 'SHIPPED'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    orderStatus?: string[];

    @ApiPropertyOptional({ description: 'Filter by payment status', example: ['COMPLETED'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    paymentStatus?: string[];

    @ApiPropertyOptional({ description: 'Filter by customer ID', example: '1' })
    @IsString()
    @IsOptional()
    customerId?: string;

    @ApiPropertyOptional({ description: 'Filter by product ID', example: '1' })
    @IsString()
    @IsOptional()
    productId?: string;

    @ApiPropertyOptional({ description: 'Page number for pagination', example: 1, minimum: 1 })
    @IsNumber()
    @IsOptional()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', example: 10, minimum: 1, maximum: 100 })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(100)
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

export class ReportRequestDto {
    @ApiProperty({ description: 'Report name', example: 'Monthly Sales Report' })
    @IsString()
    @IsNotEmpty()
    reportName: string;

    @ApiProperty({ description: 'Report description', example: 'Monthly sales performance report' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Report type', example: 'SALES' })
    @IsString()
    @IsNotEmpty()
    reportType: string;

    @ApiProperty({ description: 'Report format', example: 'PDF', enum: ReportFormat })
    @IsEnum(ReportFormat)
    format: ReportFormat;

    @ApiProperty({ description: 'Analytics query parameters', type: AnalyticsQueryDto })
    @Type(() => AnalyticsQueryDto)
    @IsOptional()
    query?: AnalyticsQueryDto;

    @ApiPropertyOptional({ description: 'Email recipients', example: ['admin@example.com'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    emailRecipients?: string[];

    @ApiPropertyOptional({ description: 'Schedule report', example: 'DAILY' })
    @IsString()
    @IsOptional()
    schedule?: string;

    @ApiPropertyOptional({ description: 'Report parameters', example: { includeCharts: true } })
    @IsOptional()
    parameters?: Record<string, any>;
}

export class DashboardQueryDto {
    @ApiPropertyOptional({ description: 'Dashboard type', example: 'EXECUTIVE' })
    @IsString()
    @IsOptional()
    dashboardType?: string;

    @ApiPropertyOptional({ description: 'Time range', example: 'LAST_30_DAYS', enum: AnalyticsTimeRange })
    @IsEnum(AnalyticsTimeRange)
    @IsOptional()
    timeRange?: AnalyticsTimeRange;

    @ApiPropertyOptional({ description: 'Include real-time data', example: true })
    @IsOptional()
    includeRealTime?: boolean = true;

    @ApiPropertyOptional({ description: 'Refresh interval in seconds', example: 30, minimum: 10 })
    @IsNumber()
    @IsOptional()
    @Min(10)
    refreshInterval?: number = 30;
}

export class KpiQueryDto {
    @ApiPropertyOptional({ description: 'KPI type', example: 'REVENUE' })
    @IsString()
    @IsOptional()
    kpiType?: string;

    @ApiPropertyOptional({ description: 'Time range', example: 'LAST_30_DAYS', enum: AnalyticsTimeRange })
    @IsEnum(AnalyticsTimeRange)
    @IsOptional()
    timeRange?: AnalyticsTimeRange;

    @ApiPropertyOptional({ description: 'Compare with previous period', example: true })
    @IsOptional()
    compareWithPrevious?: boolean = true;

    @ApiPropertyOptional({ description: 'Include trend analysis', example: true })
    @IsOptional()
    includeTrend?: boolean = true;
}
