import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';
import { OrderHealthService } from './order-health.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
    constructor(
        private readonly metricsService: MetricsService,
        private readonly orderHealth: OrderHealthService,
    ) { }

    @Get('metrics')
    @Public()
    @Header('Content-Type', 'text/plain; version=0.0.4')
    @ApiOperation({ summary: 'Get Prometheus metrics' })
    async getMetrics(@Res() res: Response) {
        const body = await this.metricsService.getMetrics();
        res.type('text/plain').send(body);
    }

    @Get('business-metrics')
    @Public()
    @ApiOperation({ summary: 'Get business metrics summary' })
    async getBusinessMetrics() {
        return await this.orderHealth.getBusinessMetrics();
    }

    @Get('order-processing-health')
    @Public()
    @ApiOperation({ summary: 'Get order processing health status' })
    async getOrderProcessingHealth() {
        return await this.orderHealth.checkOrderProcessingHealth();
    }
}


