import { Module } from '@nestjs/common';
import { RealTimeDashboardService } from './services/real-time-dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '../database/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [DashboardController],
  providers: [RealTimeDashboardService],
  exports: [RealTimeDashboardService],
})
export class DashboardModule {}
