import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OrderHealthService {
    private readonly logger = new Logger(OrderHealthService.name);

    constructor(private readonly prisma: PrismaService) { }

    async checkOrderProcessingHealth(): Promise<{
        status: 'healthy' | 'unhealthy' | 'degraded';
        details: Record<string, any>;
    }> {
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            // Check recent order processing
            const recentOrders = await this.prisma.order.count({
                where: {
                    createdAt: {
                        gte: oneHourAgo,
                    },
                },
            });

            // Check for stuck orders (pending > 24 hours)
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const stuckOrders = await this.prisma.order.count({
                where: {
                    status: 'PENDING',
                    createdAt: {
                        lte: oneDayAgo,
                    },
                },
            });

            // Check payment success rate
            const recentPayments = await this.prisma.payment.groupBy({
                by: ['status'],
                where: {
                    createdAt: {
                        gte: oneHourAgo,
                    },
                },
                _count: true,
            });

            const paymentStats = recentPayments.reduce((acc, p) => {
                acc[p.status] = p._count;
                return acc;
            }, {} as Record<string, number>);

            const totalPayments = Object.values(paymentStats).reduce((sum, count) => sum + count, 0);
            const successfulPayments = paymentStats['COMPLETED'] || 0;
            const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 100;

            // Determine health status
            let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

            if (stuckOrders > 10) {
                status = 'unhealthy';
            } else if (stuckOrders > 5 || paymentSuccessRate < 90) {
                status = 'degraded';
            }

            return {
                status,
                details: {
                    recentOrders,
                    stuckOrders,
                    paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
                    paymentStats,
                    timestamp: now.toISOString(),
                },
            };
        } catch (error) {
            this.logger.error('Order health check failed', error);
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }

    async getBusinessMetrics() {
        try {
            const [
                totalOrders,
                pendingOrders,
                completedOrders,
                failedOrders,
                totalPayments,
                successfulPayments,
                failedPayments,
                totalShipments,
                deliveredShipments,
                inTransitShipments,
            ] = await Promise.all([
                this.prisma.order.count(),
                this.prisma.order.count({ where: { status: 'PENDING' } }),
                this.prisma.order.count({ where: { status: 'COMPLETED' } }),
                this.prisma.order.count({ where: { status: 'CANCELLED' } }),
                this.prisma.payment.count(),
                this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
                this.prisma.payment.count({ where: { status: 'FAILED' } }),
                this.prisma.shipment.count(),
                this.prisma.shipment.count({ where: { status: 'DELIVERED' } }),
                this.prisma.shipment.count({ where: { status: 'IN_TRANSIT' } }),
            ]);

            return {
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    completed: completedOrders,
                    failed: failedOrders,
                },
                payments: {
                    total: totalPayments,
                    successful: successfulPayments,
                    failed: failedPayments,
                },
                shipments: {
                    total: totalShipments,
                    delivered: deliveredShipments,
                    inTransit: inTransitShipments,
                },
            };
        } catch (error) {
            this.logger.error('Failed to get business metrics', error);
            throw error;
        }
    }
}

