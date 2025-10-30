import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, ReportRequestDto, DashboardQueryDto } from './dto/analytics-query.dto';
import {
    OrderMetricsDto,
    RevenueMetricsDto,
    CustomerMetricsDto,
    ProductMetricsDto,
    DashboardDataDto,
    KpiDataDto,
    AnalyticsSummaryDto,
    ReportDataDto
} from './dto/analytics-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    // Order Analytics Endpoints
    @Get('orders/metrics')
    @ApiOperation({ summary: 'Get order metrics' })
    @ApiResponse({ status: 200, description: 'Order metrics retrieved successfully', type: OrderMetricsDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getOrderMetrics(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<OrderMetricsDto> {
        return this.analyticsService.getOrderMetrics(query);
    }

    @Get('revenue/metrics')
    @ApiOperation({ summary: 'Get revenue metrics' })
    @ApiResponse({ status: 200, description: 'Revenue metrics retrieved successfully', type: RevenueMetricsDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getRevenueMetrics(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<RevenueMetricsDto> {
        return this.analyticsService.getRevenueMetrics(query);
    }

    @Get('customers/metrics')
    @ApiOperation({ summary: 'Get customer metrics' })
    @ApiResponse({ status: 200, description: 'Customer metrics retrieved successfully', type: CustomerMetricsDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getCustomerMetrics(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<CustomerMetricsDto> {
        return this.analyticsService.getCustomerMetrics(query);
    }

    @Get('products/metrics')
    @ApiOperation({ summary: 'Get product metrics' })
    @ApiResponse({ status: 200, description: 'Product metrics retrieved successfully', type: ProductMetricsDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getProductMetrics(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<ProductMetricsDto> {
        return this.analyticsService.getProductMetrics(query);
    }

    @Get('orders/volume-over-time')
    @ApiOperation({ summary: 'Get order volume over time' })
    @ApiResponse({ status: 200, description: 'Order volume data retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getOrderVolumeOverTime(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getOrderVolumeOverTime(query);
    }

    @Get('revenue/over-time')
    @ApiOperation({ summary: 'Get revenue over time' })
    @ApiResponse({ status: 200, description: 'Revenue data retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getRevenueOverTime(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getRevenueOverTime(query);
    }

    @Get('orders/status-distribution')
    @ApiOperation({ summary: 'Get order status distribution' })
    @ApiResponse({ status: 200, description: 'Order status distribution retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getOrderStatusDistribution(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<Record<string, number>> {
        return this.analyticsService.getOrderStatusDistribution(query);
    }

    @Get('payments/method-distribution')
    @ApiOperation({ summary: 'Get payment method distribution' })
    @ApiResponse({ status: 200, description: 'Payment method distribution retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getPaymentMethodDistribution(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<Record<string, number>> {
        return this.analyticsService.getPaymentMethodDistribution(query);
    }

    @Get('geographic/distribution')
    @ApiOperation({ summary: 'Get geographic distribution' })
    @ApiResponse({ status: 200, description: 'Geographic distribution retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getGeographicDistribution(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<Record<string, number>> {
        return this.analyticsService.getGeographicDistribution(query);
    }

    @Get('orders/hourly-distribution')
    @ApiOperation({ summary: 'Get hourly order distribution' })
    @ApiResponse({ status: 200, description: 'Hourly order distribution retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getHourlyOrderDistribution(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<Array<{ hour: number; orders: number }>> {
        return this.analyticsService.getHourlyOrderDistribution(query);
    }

    @Get('products/top-performing')
    @ApiQuery({ name: 'limit', description: 'Number of top products to return', required: false, example: 10 })
    @ApiOperation({ summary: 'Get top performing products' })
    @ApiResponse({ status: 200, description: 'Top performing products retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getTopPerformingProducts(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any,
        @Query('limit') limit?: number
    ): Promise<any[]> {
        return this.analyticsService.getTopPerformingProducts(query, limit);
    }

    @Get('customers/segmentation')
    @ApiOperation({ summary: 'Get customer segmentation' })
    @ApiResponse({ status: 200, description: 'Customer segmentation retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getCustomerSegmentation(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getCustomerSegmentation(query);
    }

    @Get('fulfillment/metrics')
    @ApiOperation({ summary: 'Get order fulfillment metrics' })
    @ApiResponse({ status: 200, description: 'Fulfillment metrics retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getOrderFulfillmentMetrics(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getOrderFulfillmentMetrics(query);
    }

    // Reporting Endpoints
    @Post('reports')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Generate a new report' })
    @ApiResponse({ status: 201, description: 'Report generated successfully', type: ReportDataDto })
    @ApiResponse({ status: 400, description: 'Invalid report request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async generateReport(
        @Body() reportRequest: ReportRequestDto,
        @CurrentUser() user: any
    ): Promise<ReportDataDto> {
        return this.analyticsService.generateReport(reportRequest);
    }

    @Get('reports/:id')
    @ApiParam({ name: 'id', description: 'Report ID', example: '1' })
    @ApiOperation({ summary: 'Get report by ID' })
    @ApiResponse({ status: 200, description: 'Report retrieved successfully', type: ReportDataDto })
    @ApiResponse({ status: 404, description: 'Report not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getReport(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<ReportDataDto> {
        return this.analyticsService.getReport(id);
    }

    @Get('reports')
    @ApiOperation({ summary: 'Get reports list' })
    @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getReports(
        @Query() query: { page?: number; limit?: number; reportType?: string },
        @CurrentUser() user: any
    ): Promise<{ reports: ReportDataDto[]; total: number; page: number; limit: number }> {
        return this.analyticsService.getReports(query);
    }

    @Delete('reports/:id')
    @ApiParam({ name: 'id', description: 'Report ID', example: '1' })
    @ApiOperation({ summary: 'Delete report' })
    @ApiResponse({ status: 200, description: 'Report deleted successfully' })
    @ApiResponse({ status: 404, description: 'Report not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async deleteReport(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<void> {
        return this.analyticsService.deleteReport(id);
    }

    @Post('reports/:id/schedule')
    @ApiParam({ name: 'id', description: 'Report ID', example: '1' })
    @ApiOperation({ summary: 'Schedule report' })
    @ApiResponse({ status: 200, description: 'Report scheduled successfully' })
    @ApiResponse({ status: 404, description: 'Report not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async scheduleReport(
        @Param('id') id: string,
        @Body() scheduleData: { schedule: string },
        @CurrentUser() user: any
    ): Promise<{ scheduleId: string; nextRun: Date }> {
        const report = await this.analyticsService.getReport(id);
        return this.analyticsService.scheduleReport(report as any, scheduleData.schedule);
    }

    @Post('reports/:id/export')
    @ApiParam({ name: 'id', description: 'Report ID', example: '1' })
    @ApiOperation({ summary: 'Export report' })
    @ApiResponse({ status: 200, description: 'Report exported successfully' })
    @ApiResponse({ status: 404, description: 'Report not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async exportReport(
        @Param('id') id: string,
        @Body() exportData: { format: string },
        @CurrentUser() user: any
    ): Promise<{ downloadUrl: string; expiresAt: Date }> {
        return this.analyticsService.exportReport(id, exportData.format);
    }

    @Get('reports/templates')
    @ApiOperation({ summary: 'Get report templates' })
    @ApiResponse({ status: 200, description: 'Report templates retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getReportTemplates(
        @CurrentUser() user: any
    ): Promise<any[]> {
        return this.analyticsService.getReportTemplates();
    }

    // Dashboard Endpoints
    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard data' })
    @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully', type: DashboardDataDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getDashboardData(
        @Query() query: DashboardQueryDto,
        @CurrentUser() user: any
    ): Promise<DashboardDataDto> {
        return this.analyticsService.getDashboardData(query);
    }

    @Get('dashboard/kpis')
    @ApiOperation({ summary: 'Get KPI data' })
    @ApiResponse({ status: 200, description: 'KPI data retrieved successfully', type: [KpiDataDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getKpiData(
        @Query() query: { kpiType?: string; timeRange?: string },
        @CurrentUser() user: any
    ): Promise<KpiDataDto[]> {
        return this.analyticsService.getKpiData(query);
    }

    @Get('dashboard/summary')
    @ApiOperation({ summary: 'Get analytics summary' })
    @ApiResponse({ status: 200, description: 'Analytics summary retrieved successfully', type: AnalyticsSummaryDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getAnalyticsSummary(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<AnalyticsSummaryDto> {
        return this.analyticsService.getAnalyticsSummary(query);
    }

    @Get('dashboard/real-time')
    @ApiOperation({ summary: 'Get real-time metrics' })
    @ApiResponse({ status: 200, description: 'Real-time metrics retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getRealTimeMetrics(
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getRealTimeMetrics();
    }

    @Get('dashboard/trends')
    @ApiOperation({ summary: 'Get trend analysis' })
    @ApiResponse({ status: 200, description: 'Trend analysis retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getTrendAnalysis(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getTrendAnalysis(query);
    }

    @Get('dashboard/alerts')
    @ApiOperation({ summary: 'Get performance alerts' })
    @ApiResponse({ status: 200, description: 'Performance alerts retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getPerformanceAlerts(
        @CurrentUser() user: any
    ): Promise<any[]> {
        return this.analyticsService.getPerformanceAlerts();
    }

    @Get('dashboard/top-performers')
    @ApiOperation({ summary: 'Get top performers' })
    @ApiResponse({ status: 200, description: 'Top performers retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getTopPerformers(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getTopPerformers(query);
    }

    @Get('dashboard/widgets')
    @ApiQuery({ name: 'dashboardType', description: 'Dashboard type', required: false, example: 'EXECUTIVE' })
    @ApiOperation({ summary: 'Get dashboard widgets' })
    @ApiResponse({ status: 200, description: 'Dashboard widgets retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getDashboardWidgets(
        @CurrentUser() user: any,
        @Query('dashboardType') dashboardType?: string
    ): Promise<any[]> {
        return this.analyticsService.getDashboardWidgets(dashboardType || 'EXECUTIVE');
    }

    // Business Intelligence Endpoints
    @Get('insights')
    @ApiOperation({ summary: 'Generate business insights' })
    @ApiResponse({ status: 200, description: 'Business insights generated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async generateBusinessInsights(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any[]> {
        return this.analyticsService.generateBusinessInsights(query);
    }

    @Get('predictive')
    @ApiOperation({ summary: 'Get predictive analysis' })
    @ApiResponse({ status: 200, description: 'Predictive analysis retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getPredictiveAnalysis(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any[]> {
        return this.analyticsService.getPredictiveAnalysis(query);
    }

    @Get('market-analysis')
    @ApiOperation({ summary: 'Get market analysis' })
    @ApiResponse({ status: 200, description: 'Market analysis retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getMarketAnalysis(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getMarketAnalysis(query);
    }

    @Get('customer-insights')
    @ApiOperation({ summary: 'Get customer insights' })
    @ApiResponse({ status: 200, description: 'Customer insights retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getCustomerInsights(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getCustomerInsights(query);
    }

    @Get('operational-efficiency')
    @ApiOperation({ summary: 'Get operational efficiency' })
    @ApiResponse({ status: 200, description: 'Operational efficiency retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getOperationalEfficiency(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getOperationalEfficiency(query);
    }

    @Get('risk-assessment')
    @ApiOperation({ summary: 'Get risk assessment' })
    @ApiResponse({ status: 200, description: 'Risk assessment retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getRiskAssessment(
        @Query() query: AnalyticsQueryDto,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.analyticsService.getRiskAssessment(query);
    }
}