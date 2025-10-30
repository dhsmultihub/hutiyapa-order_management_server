import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PerformanceMonitorService } from './performance-monitor.service';
import { PerformanceController } from './performance.controller';

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [PerformanceController],
    providers: [PerformanceMonitorService],
    exports: [PerformanceMonitorService],
})
export class PerformanceModule { }

