import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DashboardType {
  EXECUTIVE = 'EXECUTIVE',
  OPERATIONS = 'OPERATIONS',
  CUSTOMER = 'CUSTOMER',
  ANALYTICS = 'ANALYTICS',
}

export enum WidgetType {
  METRIC_CARD = 'METRIC_CARD',
  CHART = 'CHART',
  TABLE = 'TABLE',
  LIST = 'LIST',
  PROGRESS_BAR = 'PROGRESS_BAR',
  PIE_CHART = 'PIE_CHART',
  LINE_CHART = 'LINE_CHART',
  BAR_CHART = 'BAR_CHART',
  REAL_TIME_FEED = 'REAL_TIME_FEED',
  ALERT = 'ALERT',
}

export class DashboardWidgetDto {
  @ApiProperty({ description: 'Widget ID', example: 'widget-1' })
  id: string;

  @ApiProperty({ enum: WidgetType, description: 'Type of widget' })
  type: WidgetType;

  @ApiProperty({ description: 'Widget title', example: 'Total Orders' })
  title: string;

  @ApiProperty({ description: 'Widget description', example: 'Total number of orders today' })
  description?: string;

  @ApiProperty({ description: 'Widget position and size' })
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };

  @ApiProperty({ description: 'Widget configuration' })
  config: Record<string, any>;

  @ApiProperty({ description: 'Widget data' })
  data: any;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;

  @ApiProperty({ description: 'Refresh interval in seconds', example: 30 })
  refreshInterval?: number;
}

export class DashboardDto {
  @ApiProperty({ description: 'Dashboard ID', example: 'dashboard-1' })
  id: string;

  @ApiProperty({ description: 'Dashboard name', example: 'Executive Dashboard' })
  name: string;

  @ApiProperty({ enum: DashboardType, description: 'Dashboard type' })
  type: DashboardType;

  @ApiProperty({ description: 'Dashboard description' })
  description?: string;

  @ApiProperty({ description: 'Dashboard owner ID', example: '1' })
  ownerId: string;

  @ApiProperty({ description: 'Whether dashboard is shared', example: false })
  isShared: boolean;

  @ApiProperty({ description: 'Dashboard widgets', type: [DashboardWidgetDto] })
  widgets: DashboardWidgetDto[];

  @ApiProperty({ description: 'Dashboard layout configuration' })
  layout: {
    columns: number;
    rowHeight: number;
    margin: [number, number];
  };

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: Date;
}

export class CreateDashboardDto {
  @ApiProperty({ description: 'Dashboard name', example: 'My Dashboard' })
  @IsString()
  name: string;

  @ApiProperty({ enum: DashboardType, description: 'Dashboard type' })
  @IsEnum(DashboardType)
  type: DashboardType;

  @ApiPropertyOptional({ description: 'Dashboard description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether dashboard is shared' })
  @IsOptional()
  isShared?: boolean = false;

  @ApiPropertyOptional({ description: 'Dashboard layout configuration' })
  @IsObject()
  @IsOptional()
  layout?: {
    columns: number;
    rowHeight: number;
    margin: [number, number];
  };
}

export class UpdateDashboardDto {
  @ApiPropertyOptional({ description: 'Dashboard name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Dashboard description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether dashboard is shared' })
  @IsOptional()
  isShared?: boolean;

  @ApiPropertyOptional({ description: 'Dashboard layout configuration' })
  @IsObject()
  @IsOptional()
  layout?: {
    columns: number;
    rowHeight: number;
    margin: [number, number];
  };
}

export class AddWidgetDto {
  @ApiProperty({ enum: WidgetType, description: 'Type of widget to add' })
  @IsEnum(WidgetType)
  type: WidgetType;

  @ApiProperty({ description: 'Widget title', example: 'New Widget' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Widget description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Widget position and size' })
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };

  @ApiPropertyOptional({ description: 'Widget configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Refresh interval in seconds' })
  @IsOptional()
  refreshInterval?: number;
}

export class UpdateWidgetDto {
  @ApiPropertyOptional({ description: 'Widget title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Widget description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Widget position and size' })
  @IsOptional()
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };

  @ApiPropertyOptional({ description: 'Widget configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Refresh interval in seconds' })
  @IsOptional()
  refreshInterval?: number;
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: DashboardType, description: 'Filter by dashboard type' })
  @IsEnum(DashboardType)
  @IsOptional()
  type?: DashboardType;

  @ApiPropertyOptional({ description: 'Filter by owner ID', example: '1' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by shared dashboards', example: true })
  @IsOptional()
  isShared?: boolean;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsString()
  @IsOptional()
  page?: string = '1';

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsString()
  @IsOptional()
  limit?: string = '20';
}

export class RealTimeMetricsDto {
  @ApiProperty({ description: 'Total orders', example: 1250 })
  totalOrders: number;

  @ApiProperty({ description: 'Orders today', example: 45 })
  ordersToday: number;

  @ApiProperty({ description: 'Total revenue', example: 125000.50 })
  totalRevenue: number;

  @ApiProperty({ description: 'Revenue today', example: 2500.75 })
  revenueToday: number;

  @ApiProperty({ description: 'Active orders', example: 23 })
  activeOrders: number;

  @ApiProperty({ description: 'Pending orders', example: 8 })
  pendingOrders: number;

  @ApiProperty({ description: 'Completed orders', example: 1200 })
  completedOrders: number;

  @ApiProperty({ description: 'Cancelled orders', example: 22 })
  cancelledOrders: number;

  @ApiProperty({ description: 'Average order value', example: 100.40 })
  averageOrderValue: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}

export class RealTimeOrderFeedDto {
  @ApiProperty({ description: 'Order ID', example: '1' })
  orderId: string;

  @ApiProperty({ description: 'Order number', example: 'ORD-2025-001' })
  orderNumber: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  customerName: string;

  @ApiProperty({ description: 'Order status', example: 'PROCESSING' })
  status: string;

  @ApiProperty({ description: 'Order amount', example: 150.75 })
  amount: number;

  @ApiProperty({ description: 'Event type', example: 'ORDER_CREATED' })
  eventType: string;

  @ApiProperty({ description: 'Event timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Event description', example: 'New order created' })
  description: string;
}
