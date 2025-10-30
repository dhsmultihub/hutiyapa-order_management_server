import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { OrderAnalyticsService } from './services/order-analytics.service';
import { ReportingService } from './services/reporting.service';
import { DashboardService } from './services/dashboard.service';
import { BusinessIntelligenceService } from './services/business-intelligence.service';

@Module({
    controllers: [AnalyticsController],
    providers: [
        AnalyticsService,
        OrderAnalyticsService,
        ReportingService,
        DashboardService,
        BusinessIntelligenceService,
    ],
    exports: [AnalyticsService, OrderAnalyticsService, ReportingService, DashboardService, BusinessIntelligenceService],
})
export class AnalyticsModule { }