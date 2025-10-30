import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderMetricsDto {
    @ApiProperty({ description: 'Total orders', example: 1250 })
    totalOrders: number;

    @ApiProperty({ description: 'Completed orders', example: 1100 })
    completedOrders: number;

    @ApiProperty({ description: 'Pending orders', example: 50 })
    pendingOrders: number;

    @ApiProperty({ description: 'Cancelled orders', example: 100 })
    cancelledOrders: number;

    @ApiProperty({ description: 'Order completion rate', example: 88.0 })
    completionRate: number;

    @ApiProperty({ description: 'Average order value', example: 2500.50 })
    averageOrderValue: number;

    @ApiProperty({ description: 'Total revenue', example: 3125625.00 })
    totalRevenue: number;

    @ApiProperty({ description: 'Orders per day', example: 41.7 })
    ordersPerDay: number;

    @ApiProperty({ description: 'Growth rate', example: 15.5 })
    growthRate: number;
}

export class RevenueMetricsDto {
    @ApiProperty({ description: 'Total revenue', example: 3125625.00 })
    totalRevenue: number;

    @ApiProperty({ description: 'Revenue growth', example: 15.5 })
    revenueGrowth: number;

    @ApiProperty({ description: 'Average order value', example: 2500.50 })
    averageOrderValue: number;

    @ApiProperty({ description: 'Revenue per customer', example: 12500.00 })
    revenuePerCustomer: number;

    @ApiProperty({ description: 'Monthly recurring revenue', example: 260468.75 })
    monthlyRecurringRevenue: number;

    @ApiProperty({ description: 'Revenue by payment method', example: { credit_card: 60, upi: 30, net_banking: 10 } })
    revenueByPaymentMethod: Record<string, number>;

    @ApiProperty({ description: 'Revenue by region', example: { north: 40, south: 35, east: 15, west: 10 } })
    revenueByRegion: Record<string, number>;
}

export class CustomerMetricsDto {
    @ApiProperty({ description: 'Total customers', example: 250 })
    totalCustomers: number;

    @ApiProperty({ description: 'New customers', example: 45 })
    newCustomers: number;

    @ApiProperty({ description: 'Returning customers', example: 205 })
    returningCustomers: number;

    @ApiProperty({ description: 'Customer retention rate', example: 82.0 })
    retentionRate: number;

    @ApiProperty({ description: 'Average orders per customer', example: 5.0 })
    averageOrdersPerCustomer: number;

    @ApiProperty({ description: 'Customer lifetime value', example: 12500.00 })
    customerLifetimeValue: number;

    @ApiProperty({ description: 'Customer acquisition cost', example: 500.00 })
    customerAcquisitionCost: number;

    @ApiProperty({ description: 'Top customers by revenue', example: [{ customerId: '1', revenue: 50000 }] })
    topCustomers: Array<{ customerId: string; revenue: number; orders: number }>;
}

export class ProductMetricsDto {
    @ApiProperty({ description: 'Total products', example: 150 })
    totalProducts: number;

    @ApiProperty({ description: 'Top selling products', example: [{ productId: '1', sales: 100, revenue: 250000 }] })
    topSellingProducts: Array<{ productId: string; productName: string; sales: number; revenue: number }>;

    @ApiProperty({ description: 'Low stock products', example: [{ productId: '2', stock: 5, threshold: 10 }] })
    lowStockProducts: Array<{ productId: string; productName: string; stock: number; threshold: number }>;

    @ApiProperty({ description: 'Product performance by category', example: { electronics: 60, clothing: 25, books: 15 } })
    performanceByCategory: Record<string, number>;

    @ApiProperty({ description: 'Average product rating', example: 4.2 })
    averageProductRating: number;

    @ApiProperty({ description: 'Product return rate', example: 5.5 })
    productReturnRate: number;
}

export class TimeSeriesDataDto {
    @ApiProperty({ description: 'Data points', example: [{ date: '2024-01-01', value: 100 }] })
    dataPoints: Array<{ date: string; value: number; label?: string }>;

    @ApiProperty({ description: 'Time period', example: 'daily' })
    period: string;

    @ApiProperty({ description: 'Total data points', example: 30 })
    totalPoints: number;

    @ApiProperty({ description: 'Trend direction', example: 'up' })
    trend: 'up' | 'down' | 'stable';

    @ApiProperty({ description: 'Trend percentage', example: 15.5 })
    trendPercentage: number;
}

export class DashboardDataDto {
    @ApiProperty({ description: 'Order metrics', type: OrderMetricsDto })
    orderMetrics: OrderMetricsDto;

    @ApiProperty({ description: 'Revenue metrics', type: RevenueMetricsDto })
    revenueMetrics: RevenueMetricsDto;

    @ApiProperty({ description: 'Customer metrics', type: CustomerMetricsDto })
    customerMetrics: CustomerMetricsDto;

    @ApiProperty({ description: 'Product metrics', type: ProductMetricsDto })
    productMetrics: ProductMetricsDto;

    @ApiProperty({ description: 'Order volume over time', type: TimeSeriesDataDto })
    orderVolumeOverTime: TimeSeriesDataDto;

    @ApiProperty({ description: 'Revenue over time', type: TimeSeriesDataDto })
    revenueOverTime: TimeSeriesDataDto;

    @ApiProperty({ description: 'Last updated', example: '2024-01-15T10:30:00Z' })
    lastUpdated: Date;

    @ApiProperty({ description: 'Refresh interval in seconds', example: 30 })
    refreshInterval: number;
}

export class ReportDataDto {
    @ApiProperty({ description: 'Report ID', example: '1' })
    reportId: string;

    @ApiProperty({ description: 'Report name', example: 'Monthly Sales Report' })
    reportName: string;

    @ApiProperty({ description: 'Report type', example: 'SALES' })
    reportType: string;

    @ApiProperty({ description: 'Report format', example: 'PDF' })
    format: string;

    @ApiProperty({ description: 'Generated at', example: '2024-01-15T10:30:00Z' })
    generatedAt: Date;

    @ApiProperty({ description: 'File size in bytes', example: 1024000 })
    fileSize: number;

    @ApiProperty({ description: 'Download URL', example: '/reports/download/1' })
    downloadUrl: string;

    @ApiProperty({ description: 'Report data', example: {} })
    data: any;

    @ApiPropertyOptional({ description: 'Report summary', example: 'Total revenue: ₹3,125,625' })
    summary?: string;
}

export class KpiDataDto {
    @ApiProperty({ description: 'KPI name', example: 'Total Revenue' })
    name: string;

    @ApiProperty({ description: 'Current value', example: 3125625.00 })
    currentValue: number;

    @ApiProperty({ description: 'Previous value', example: 2700000.00 })
    previousValue: number;

    @ApiProperty({ description: 'Change percentage', example: 15.5 })
    changePercentage: number;

    @ApiProperty({ description: 'Change direction', example: 'up' })
    direction: 'up' | 'down' | 'stable';

    @ApiProperty({ description: 'Target value', example: 3500000.00 })
    targetValue: number;

    @ApiProperty({ description: 'Progress percentage', example: 89.3 })
    progressPercentage: number;

    @ApiProperty({ description: 'Unit', example: 'INR' })
    unit: string;

    @ApiProperty({ description: 'Trend data', type: TimeSeriesDataDto })
    trend: TimeSeriesDataDto;
}

export class AnalyticsSummaryDto {
    @ApiProperty({ description: 'Total orders', example: 1250 })
    totalOrders: number;

    @ApiProperty({ description: 'Total revenue', example: 3125625.00 })
    totalRevenue: number;

    @ApiProperty({ description: 'Total customers', example: 250 })
    totalCustomers: number;

    @ApiProperty({ description: 'Average order value', example: 2500.50 })
    averageOrderValue: number;

    @ApiProperty({ description: 'Growth rate', example: 15.5 })
    growthRate: number;

    @ApiProperty({ description: 'Top performing metrics', example: ['Revenue', 'Orders', 'Customers'] })
    topMetrics: string[];

    @ApiProperty({ description: 'Areas for improvement', example: ['Customer Retention', 'Product Returns'] })
    improvementAreas: string[];

    @ApiProperty({ description: 'Key insights', example: ['Revenue up 15.5%', 'Customer base growing'] })
    insights: string[];
}
