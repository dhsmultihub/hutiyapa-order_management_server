import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CacheModule } from '../cache/cache.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
    imports: [CacheModule, MonitoringModule],
    controllers: [HealthController],
    providers: [HealthService],
})
export class HealthModule { }
