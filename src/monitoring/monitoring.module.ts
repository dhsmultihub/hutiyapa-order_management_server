import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MonitoringController } from './monitoring.controller';
import { AlertingService } from './alerting.service';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { ExternalHealthService } from './external-health.service';
import { OrderHealthService } from './order-health.service';
import { ErrorTrackingService } from './error-tracking.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [
        MetricsService,
        AlertingService,
        HttpMetricsInterceptor,
        ExternalHealthService,
        OrderHealthService,
        ErrorTrackingService,
    ],
    controllers: [MonitoringController],
    exports: [
        MetricsService,
        AlertingService,
        HttpMetricsInterceptor,
        ExternalHealthService,
        OrderHealthService,
        ErrorTrackingService,
    ],
})
export class MonitoringModule { }


