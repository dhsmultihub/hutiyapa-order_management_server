import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { ExternalHealthService } from '../monitoring/external-health.service';
import { OrderHealthService } from '../monitoring/order-health.service';

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly cacheService: CacheService,
        private readonly externalHealth: ExternalHealthService,
        private readonly orderHealth: OrderHealthService,
    ) { }

    async getHealth() {
        const startTime = Date.now();

        try {
            // Check database connectivity
            const dbHealthy = await this.prismaService.isHealthy();

            // Check cache/Redis health
            const cacheHealthy = await this.cacheService.isHealthy();

            // Check application info
            const appInfo = {
                name: 'Order Management Service',
                version: '1.0.0',
                environment: this.configService.get('NODE_ENV', 'development'),
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            };

            // Check system resources
            const systemInfo = {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                platform: process.platform,
                nodeVersion: process.version,
            };

            const responseTime = Date.now() - startTime;

            // External services (optional)
            const externals = await this.externalHealth.checkAll();

            // Order processing health
            const orderProcessing = await this.orderHealth.checkOrderProcessingHealth();

            // Overall status based on all checks
            let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
            if (!dbHealthy || !cacheHealthy || orderProcessing.status === 'unhealthy') {
                overallStatus = 'unhealthy';
            } else if (orderProcessing.status === 'degraded') {
                overallStatus = 'degraded';
            }

            return {
                status: overallStatus,
                ...appInfo,
                checks: {
                    database: {
                        status: dbHealthy ? 'healthy' : 'unhealthy',
                        responseTime: `${responseTime}ms`,
                    },
                    cache: {
                        status: cacheHealthy ? 'healthy' : 'unhealthy',
                    },
                    orderProcessing: {
                        status: orderProcessing.status,
                        ...orderProcessing.details,
                    },
                    external: externals,
                },
                system: systemInfo,
                responseTime: `${responseTime}ms`,
            };
        } catch (error) {
            this.logger.error('Health check failed:', error);
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    async getReadiness() {
        try {
            const dbHealthy = await this.prismaService.isHealthy();
            const cacheHealthy = await this.cacheService.isHealthy();
            const externals = await this.externalHealth.checkAll();

            if (!dbHealthy) throw new Error('Database is not ready');
            if (!cacheHealthy) throw new Error('Cache is not ready');
            const externalFailures = Object.values(externals).some((e: any) => e.status === 'unhealthy');
            if (externalFailures) throw new Error('External dependencies are not ready');

            return {
                status: 'ready',
                timestamp: new Date().toISOString(),
                checks: {
                    database: 'ready',
                    cache: 'ready',
                    external: externals,
                },
            };
        } catch (error) {
            this.logger.error('Readiness check failed:', error);
            throw error;
        }
    }

    async getLiveness() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }
}
