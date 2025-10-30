import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { ShipmentModule } from './shipment/shipment.module';
import { SupportModule } from './support/support.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReturnModule } from './return/return.module';
import { RefundModule } from './refund/refund.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrderEventsModule } from './events/order-events.module';
import { SearchModule } from './search/search.module';
import { PerformanceModule } from './performance/performance.module';
import { CacheModule } from './cache/cache.module';
import { LoggingModule } from './logging/logging.module';
import { WebSocketModule } from './websocket/websocket.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      load: [configuration],
      validationSchema: require('./config/validation.schema'),
    }),

    // Database
    PrismaModule,

    // Core modules
    OrderModule,
    PaymentModule,
    ShipmentModule,
    SupportModule,
    AnalyticsModule,
    ReturnModule,
    RefundModule,
    HealthModule,

    // Infrastructure modules
    AuthModule,
    NotificationModule,
    DashboardModule,
    OrderEventsModule,
    SearchModule,
    PerformanceModule,
    CacheModule,
    LoggingModule,
    WebSocketModule,
    MonitoringModule,
  ],
})
export class AppModule { }
