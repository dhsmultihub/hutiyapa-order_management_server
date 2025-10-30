import { Injectable, Logger } from '@nestjs/common';
import { OrderAnalyticsService } from './services/order-analytics.service';
import { ReportingService } from './services/reporting.service';
import { DashboardService } from './services/dashboard.service';
import { BusinessIntelligenceService } from './services/business-intelligence.service';
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
import { BusinessInsight, PredictiveAnalysis, MarketAnalysis, CustomerInsights } from './services/business-intelligence.service';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        private readonly orderAnalyticsService: OrderAnalyticsService,
        private readonly reportingService: ReportingService,
        private readonly dashboardService: DashboardService,
        private readonly businessIntelligenceService: BusinessIntelligenceService,
    ) { }

    // Order Analytics Methods
    async getOrderMetrics(query: AnalyticsQueryDto): Promise<OrderMetricsDto> {
        this.logger.log('Getting order metrics');
        return this.orderAnalyticsService.getOrderMetrics(query);
    }

    async getRevenueMetrics(query: AnalyticsQueryDto): Promise<RevenueMetricsDto> {
        this.logger.log('Getting revenue metrics');
        return this.orderAnalyticsService.getRevenueMetrics(query);
    }

    async getCustomerMetrics(query: AnalyticsQueryDto): Promise<CustomerMetricsDto> {
        this.logger.log('Getting customer metrics');
        return this.orderAnalyticsService.getCustomerMetrics(query);
    }

    async getProductMetrics(query: AnalyticsQueryDto): Promise<ProductMetricsDto> {
        this.logger.log('Getting product metrics');
        return this.orderAnalyticsService.getProductMetrics(query);
    }

    async getOrderVolumeOverTime(query: AnalyticsQueryDto): Promise<any> {
        this.logger.log('Getting order volume over time');
        return this.orderAnalyticsService.getOrderVolumeOverTime(query);
    }

    async getRevenueOverTime(query: AnalyticsQueryDto): Promise<any> {
        this.logger.log('Getting revenue over time');
        return this.orderAnalyticsService.getRevenueOverTime(query);
    }

    async getOrderStatusDistribution(query: AnalyticsQueryDto): Promise<Record<string, number>> {
        this.logger.log('Getting order status distribution');
        return this.orderAnalyticsService.getOrderStatusDistribution(query);
    }

    async getPaymentMethodDistribution(query: AnalyticsQueryDto): Promise<Record<string, number>> {
        this.logger.log('Getting payment method distribution');
        return this.orderAnalyticsService.getPaymentMethodDistribution(query);
    }

    async getGeographicDistribution(query: AnalyticsQueryDto): Promise<Record<string, number>> {
        this.logger.log('Getting geographic distribution');
        return this.orderAnalyticsService.getGeographicDistribution(query);
    }

    async getHourlyOrderDistribution(query: AnalyticsQueryDto): Promise<Array<{ hour: number; orders: number }>> {
        this.logger.log('Getting hourly order distribution');
        return this.orderAnalyticsService.getHourlyOrderDistribution(query);
    }

    async getTopPerformingProducts(query: AnalyticsQueryDto, limit: number = 10): Promise<any[]> {
        this.logger.log(`Getting top ${limit} performing products`);
        return this.orderAnalyticsService.getTopPerformingProducts(query, limit);
    }

    async getCustomerSegmentation(query: AnalyticsQueryDto): Promise<any> {
        this.logger.log('Getting customer segmentation');
        return this.orderAnalyticsService.getCustomerSegmentation(query);
    }

    async getOrderFulfillmentMetrics(query: AnalyticsQueryDto): Promise<any> {
        this.logger.log('Getting order fulfillment metrics');
        return this.orderAnalyticsService.getOrderFulfillmentMetrics(query);
    }

    // Reporting Methods
    async generateReport(reportRequest: ReportRequestDto): Promise<ReportDataDto> {
        this.logger.log(`Generating report: ${reportRequest.reportName}`);
        return this.reportingService.generateReport(reportRequest);
    }

    async getReport(reportId: string): Promise<ReportDataDto> {
        this.logger.log(`Getting report: ${reportId}`);
        return this.reportingService.getReport(reportId);
    }

    async getReports(query: { page?: number; limit?: number; reportType?: string }): Promise<{
        reports: ReportDataDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        this.logger.log('Getting reports list');
        return this.reportingService.getReports(query);
    }

    async deleteReport(reportId: string): Promise<void> {
        this.logger.log(`Deleting report: ${reportId}`);
        return this.reportingService.deleteReport(reportId);
    }

    async scheduleReport(reportRequest: ReportRequestDto, schedule: string): Promise<{ scheduleId: string; nextRun: Date }> {
        this.logger.log(`Scheduling report: ${reportRequest.reportName}`);
        return this.reportingService.scheduleReport(reportRequest, schedule);
    }

    async exportReport(reportId: string, format: string): Promise<{ downloadUrl: string; expiresAt: Date }> {
        this.logger.log(`Exporting report ${reportId} in ${format} format`);
        return this.reportingService.exportReport(reportId, format);
    }

    async getReportTemplates(): Promise<any[]> {
        this.logger.log('Getting report templates');
        return this.reportingService.getReportTemplates();
    }

    // Dashboard Methods
    async getDashboardData(query: DashboardQueryDto): Promise<DashboardDataDto> {
        this.logger.log('Getting dashboard data');
        return this.dashboardService.getDashboardData(query);
    }

    async getKpiData(query: { kpiType?: string; timeRange?: string }): Promise<KpiDataDto[]> {
        this.logger.log('Getting KPI data');
        return this.dashboardService.getKpiData(query);
    }

    async getAnalyticsSummary(query: AnalyticsQueryDto): Promise<AnalyticsSummaryDto> {
        this.logger.log('Getting analytics summary');
        return this.dashboardService.getAnalyticsSummary(query);
    }

    async getRealTimeMetrics(): Promise<any> {
        this.logger.log('Getting real-time metrics');
        return this.dashboardService.getRealTimeMetrics();
    }

    async getTrendAnalysis(query: AnalyticsQueryDto): Promise<any> {
        this.logger.log('Getting trend analysis');
        return this.dashboardService.getTrendAnalysis(query);
    }

    async getPerformanceAlerts(): Promise<any[]> {
        this.logger.log('Getting performance alerts');
        return this.dashboardService.getPerformanceAlerts();
    }

    async getTopPerformers(query: AnalyticsQueryDto): Promise<any> {
        this.logger.log('Getting top performers');
        return this.dashboardService.getTopPerformers(query);
    }

    async getDashboardWidgets(dashboardType: string): Promise<any[]> {
        this.logger.log(`Getting dashboard widgets for type: ${dashboardType}`);
        return this.dashboardService.getDashboardWidgets(dashboardType);
    }

    // Business Intelligence Methods
    async generateBusinessInsights(query: AnalyticsQueryDto): Promise<BusinessInsight[]> {
        this.logger.log('Generating business insights');
        return this.businessIntelligenceService.generateBusinessInsights(query);
    }

    async getPredictiveAnalysis(query: AnalyticsQueryDto): Promise<PredictiveAnalysis[]> {
        this.logger.log('Getting predictive analysis');
        return this.businessIntelligenceService.getPredictiveAnalysis(query);
    }

    async getMarketAnalysis(query: AnalyticsQueryDto): Promise<MarketAnalysis> {
        this.logger.log('Getting market analysis');
        return this.businessIntelligenceService.getMarketAnalysis(query);
    }

    async getCustomerInsights(query: AnalyticsQueryDto): Promise<CustomerInsights> {
        this.logger.log('Getting customer insights');
        return this.businessIntelligenceService.getCustomerInsights(query);
    }

    async getOperationalEfficiency(query: AnalyticsQueryDto): Promise<any> {
        this.logger.log('Getting operational efficiency');
        return this.businessIntelligenceService.getOperationalEfficiency(query);
    }

    async getRiskAssessment(query: AnalyticsQueryDto): Promise<any> {
        this.logger.log('Getting risk assessment');
        return this.businessIntelligenceService.getRiskAssessment(query);
    }
}