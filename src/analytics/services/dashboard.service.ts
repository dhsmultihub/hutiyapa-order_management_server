import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DashboardQueryDto, AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { DashboardDataDto, KpiDataDto, AnalyticsSummaryDto } from '../dto/analytics-response.dto';
import { OrderAnalyticsService } from './order-analytics.service';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly orderAnalyticsService: OrderAnalyticsService,
    ) { }

    async getDashboardData(query: DashboardQueryDto): Promise<DashboardDataDto> {
        this.logger.log('Getting dashboard data');

        const analyticsQuery = this.convertDashboardQueryToAnalyticsQuery(query);

        const [
            orderMetrics,
            revenueMetrics,
            customerMetrics,
            productMetrics,
            orderVolumeOverTime,
            revenueOverTime,
        ] = await Promise.all([
            this.orderAnalyticsService.getOrderMetrics(analyticsQuery),
            this.orderAnalyticsService.getRevenueMetrics(analyticsQuery),
            this.orderAnalyticsService.getCustomerMetrics(analyticsQuery),
            this.orderAnalyticsService.getProductMetrics(analyticsQuery),
            this.orderAnalyticsService.getOrderVolumeOverTime(analyticsQuery),
            this.orderAnalyticsService.getRevenueOverTime(analyticsQuery),
        ]);

        return {
            orderMetrics,
            revenueMetrics,
            customerMetrics,
            productMetrics,
            orderVolumeOverTime,
            revenueOverTime,
            lastUpdated: new Date(),
            refreshInterval: query.refreshInterval || 30,
        };
    }

    async getKpiData(query: { kpiType?: string; timeRange?: string }): Promise<KpiDataDto[]> {
        this.logger.log('Getting KPI data');

        // Mock implementation - would query actual DB in production
        return [
            {
                name: 'Total Revenue',
                currentValue: 3125625.00,
                previousValue: 2700000.00,
                changePercentage: 15.5,
                direction: 'up',
                targetValue: 3500000.00,
                progressPercentage: 89.3,
                unit: 'INR',
                trend: {
                    dataPoints: [
                        { date: '2024-01-01', value: 2500000 },
                        { date: '2024-01-15', value: 2800000 },
                        { date: '2024-01-31', value: 3125625 },
                    ],
                    period: 'monthly',
                    totalPoints: 3,
                    trend: 'up',
                    trendPercentage: 15.5,
                },
            },
            {
                name: 'Total Orders',
                currentValue: 1250,
                previousValue: 1100,
                changePercentage: 13.6,
                direction: 'up',
                targetValue: 1500,
                progressPercentage: 83.3,
                unit: 'orders',
                trend: {
                    dataPoints: [
                        { date: '2024-01-01', value: 1000 },
                        { date: '2024-01-15', value: 1150 },
                        { date: '2024-01-31', value: 1250 },
                    ],
                    period: 'monthly',
                    totalPoints: 3,
                    trend: 'up',
                    trendPercentage: 13.6,
                },
            },
            {
                name: 'Customer Satisfaction',
                currentValue: 4.2,
                previousValue: 4.0,
                changePercentage: 5.0,
                direction: 'up',
                targetValue: 4.5,
                progressPercentage: 93.3,
                unit: 'rating',
                trend: {
                    dataPoints: [
                        { date: '2024-01-01', value: 3.8 },
                        { date: '2024-01-15', value: 4.0 },
                        { date: '2024-01-31', value: 4.2 },
                    ],
                    period: 'monthly',
                    totalPoints: 3,
                    trend: 'up',
                    trendPercentage: 5.0,
                },
            },
        ];
    }

    async getAnalyticsSummary(query: AnalyticsQueryDto): Promise<AnalyticsSummaryDto> {
        this.logger.log('Getting analytics summary');

        const [
            orderMetrics,
            revenueMetrics,
            customerMetrics,
        ] = await Promise.all([
            this.orderAnalyticsService.getOrderMetrics(query),
            this.orderAnalyticsService.getRevenueMetrics(query),
            this.orderAnalyticsService.getCustomerMetrics(query),
        ]);

        return {
            totalOrders: orderMetrics.totalOrders,
            totalRevenue: revenueMetrics.totalRevenue,
            totalCustomers: customerMetrics.totalCustomers,
            averageOrderValue: orderMetrics.averageOrderValue,
            growthRate: orderMetrics.growthRate,
            topMetrics: ['Revenue', 'Orders', 'Customers'],
            improvementAreas: ['Customer Retention', 'Product Returns'],
            insights: [
                `Revenue increased by ${orderMetrics.growthRate}% this period`,
                `Customer base grew to ${customerMetrics.totalCustomers} customers`,
                `Average order value is ₹${orderMetrics.averageOrderValue}`,
            ],
        };
    }

    async getRealTimeMetrics(): Promise<{
        currentOrders: number;
        todayRevenue: number;
        activeUsers: number;
        systemStatus: string;
        lastUpdated: Date;
    }> {
        this.logger.log('Getting real-time metrics');

        // Mock implementation - would query actual DB in production
        return {
            currentOrders: 25,
            todayRevenue: 125000,
            activeUsers: 15,
            systemStatus: 'healthy',
            lastUpdated: new Date(),
        };
    }

    async getTrendAnalysis(query: AnalyticsQueryDto): Promise<{
        orderTrend: 'up' | 'down' | 'stable';
        revenueTrend: 'up' | 'down' | 'stable';
        customerTrend: 'up' | 'down' | 'stable';
        orderTrendPercentage: number;
        revenueTrendPercentage: number;
        customerTrendPercentage: number;
    }> {
        this.logger.log('Getting trend analysis');

        // Mock implementation - would analyze actual trends in production
        return {
            orderTrend: 'up',
            revenueTrend: 'up',
            customerTrend: 'up',
            orderTrendPercentage: 15.5,
            revenueTrendPercentage: 12.3,
            customerTrendPercentage: 8.7,
        };
    }

    async getPerformanceAlerts(): Promise<Array<{
        id: string;
        type: 'warning' | 'error' | 'info';
        title: string;
        message: string;
        timestamp: Date;
        actionRequired: boolean;
    }>> {
        this.logger.log('Getting performance alerts');

        // Mock implementation - would check actual performance metrics in production
        return [
            {
                id: 'alert_1',
                type: 'warning',
                title: 'Low Stock Alert',
                message: '5 products are running low on stock',
                timestamp: new Date(),
                actionRequired: true,
            },
            {
                id: 'alert_2',
                type: 'info',
                title: 'High Order Volume',
                message: 'Order volume is 20% higher than usual',
                timestamp: new Date(),
                actionRequired: false,
            },
        ];
    }

    async getTopPerformers(query: AnalyticsQueryDto): Promise<{
        topProducts: Array<{ productId: string; productName: string; sales: number; revenue: number }>;
        topCustomers: Array<{ customerId: string; customerName: string; orders: number; revenue: number }>;
        topRegions: Array<{ region: string; orders: number; revenue: number }>;
    }> {
        this.logger.log('Getting top performers');

        const [
            topProducts,
            customerMetrics,
            geographicDistribution,
        ] = await Promise.all([
            this.orderAnalyticsService.getTopPerformingProducts(query, 5),
            this.orderAnalyticsService.getCustomerMetrics(query),
            this.orderAnalyticsService.getGeographicDistribution(query),
        ]);

        return {
            topProducts: topProducts.map(p => ({
                productId: p.productId,
                productName: p.productName,
                sales: p.sales,
                revenue: p.revenue,
            })),
            topCustomers: customerMetrics.topCustomers.map(c => ({
                customerId: c.customerId,
                customerName: `Customer ${c.customerId}`,
                orders: c.orders,
                revenue: c.revenue,
            })),
            topRegions: Object.entries(geographicDistribution).map(([region, orders]) => ({
                region,
                orders: orders as number,
                revenue: (orders as number) * 2500, // Mock revenue calculation
            })),
        };
    }

    async getDashboardWidgets(dashboardType: string): Promise<Array<{
        id: string;
        type: string;
        title: string;
        data: any;
        position: { x: number; y: number; width: number; height: number };
    }>> {
        this.logger.log(`Getting dashboard widgets for type: ${dashboardType}`);

        // Mock implementation - would return actual widget configuration in production
        const baseWidgets = [
            {
                id: 'revenue_chart',
                type: 'line_chart',
                title: 'Revenue Over Time',
                data: {},
                position: { x: 0, y: 0, width: 6, height: 4 },
            },
            {
                id: 'order_metrics',
                type: 'kpi_cards',
                title: 'Order Metrics',
                data: {},
                position: { x: 6, y: 0, width: 6, height: 2 },
            },
            {
                id: 'top_products',
                type: 'bar_chart',
                title: 'Top Products',
                data: {},
                position: { x: 0, y: 4, width: 6, height: 4 },
            },
        ];

        switch (dashboardType) {
            case 'EXECUTIVE':
                return baseWidgets;
            case 'OPERATIONAL':
                return [
                    ...baseWidgets,
                    {
                        id: 'order_status',
                        type: 'pie_chart',
                        title: 'Order Status Distribution',
                        data: {},
                        position: { x: 6, y: 2, width: 6, height: 4 },
                    },
                ];
            case 'ANALYTICAL':
                return [
                    ...baseWidgets,
                    {
                        id: 'customer_segmentation',
                        type: 'donut_chart',
                        title: 'Customer Segmentation',
                        data: {},
                        position: { x: 6, y: 2, width: 6, height: 4 },
                    },
                    {
                        id: 'geographic_distribution',
                        type: 'map_chart',
                        title: 'Geographic Distribution',
                        data: {},
                        position: { x: 0, y: 8, width: 12, height: 4 },
                    },
                ];
            default:
                return baseWidgets;
        }
    }

    private convertDashboardQueryToAnalyticsQuery(dashboardQuery: DashboardQueryDto): AnalyticsQueryDto {
        const analyticsQuery = new AnalyticsQueryDto();

        if (dashboardQuery.timeRange) {
            analyticsQuery.timeRange = dashboardQuery.timeRange as any;
        }

        return analyticsQuery;
    }
}
