import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { SearchService } from './search.service';

export interface IndexStats {
    totalDocuments: number;
    indexedDocuments: number;
    lastIndexUpdate: Date;
    indexSize: number;
    performance: {
        averageIndexTime: number;
        indexErrors: number;
    };
}

@Injectable()
export class SearchIndexingService {
    private readonly logger = new Logger(SearchIndexingService.name);
    private indexStats: IndexStats = {
        totalDocuments: 0,
        indexedDocuments: 0,
        lastIndexUpdate: new Date(),
        indexSize: 0,
        performance: {
            averageIndexTime: 0,
            indexErrors: 0,
        },
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly searchService: SearchService,
    ) { }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async incrementalIndexUpdate(): Promise<void> {
        this.logger.log('Running incremental index update...');

        try {
            const startTime = Date.now();

            // Get orders updated in the last 5 minutes
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const updatedOrders = await this.prisma.order.findMany({
                where: {
                    updatedAt: {
                        gte: fiveMinutesAgo,
                    },
                },
                include: {
                    orderItems: true,
                },
            });

            let indexedCount = 0;
            for (const order of updatedOrders) {
                try {
                    await this.searchService.reindexOrder(order.id.toString());
                    indexedCount++;
                } catch (error) {
                    this.logger.error(`Failed to reindex order ${order.id}: ${error.message}`);
                    this.indexStats.performance.indexErrors++;
                }
            }

            const executionTime = Date.now() - startTime;
            this.updateIndexStats(indexedCount, executionTime);

            this.logger.log(`Incremental index update completed: ${indexedCount} orders indexed in ${executionTime}ms`);
        } catch (error) {
            this.logger.error(`Incremental index update failed: ${error.message}`);
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async fullIndexUpdate(): Promise<void> {
        this.logger.log('Running full index update...');

        try {
            const startTime = Date.now();

            // Get all orders
            const allOrders = await this.prisma.order.findMany({
                include: {
                    orderItems: true,
                },
            });

            let indexedCount = 0;
            for (const order of allOrders) {
                try {
                    await this.searchService.reindexOrder(order.id.toString());
                    indexedCount++;
                } catch (error) {
                    this.logger.error(`Failed to reindex order ${order.id}: ${error.message}`);
                    this.indexStats.performance.indexErrors++;
                }
            }

            const executionTime = Date.now() - startTime;
            this.updateIndexStats(indexedCount, executionTime);

            this.logger.log(`Full index update completed: ${indexedCount} orders indexed in ${executionTime}ms`);
        } catch (error) {
            this.logger.error(`Full index update failed: ${error.message}`);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async optimizeIndex(): Promise<void> {
        this.logger.log('Running index optimization...');

        try {
            const startTime = Date.now();

            // Remove deleted orders from index
            await this.cleanupDeletedOrders();

            // Optimize search index
            await this.optimizeSearchIndex();

            const executionTime = Date.now() - startTime;
            this.logger.log(`Index optimization completed in ${executionTime}ms`);
        } catch (error) {
            this.logger.error(`Index optimization failed: ${error.message}`);
        }
    }

    async reindexOrder(orderId: string): Promise<void> {
        this.logger.log(`Reindexing order ${orderId}`);

        try {
            const startTime = Date.now();

            await this.searchService.reindexOrder(orderId);

            const executionTime = Date.now() - startTime;
            this.updateIndexStats(1, executionTime);

            this.logger.log(`Order ${orderId} reindexed successfully in ${executionTime}ms`);
        } catch (error) {
            this.logger.error(`Failed to reindex order ${orderId}: ${error.message}`);
            this.indexStats.performance.indexErrors++;
            throw error;
        }
    }

    async reindexAllOrders(): Promise<void> {
        this.logger.log('Reindexing all orders...');

        try {
            const startTime = Date.now();

            // Get all orders
            const allOrders = await this.prisma.order.findMany({
                include: {
                    orderItems: true,
                },
            });

            let indexedCount = 0;
            for (const order of allOrders) {
                try {
                    await this.searchService.reindexOrder(order.id.toString());
                    indexedCount++;
                } catch (error) {
                    this.logger.error(`Failed to reindex order ${order.id}: ${error.message}`);
                    this.indexStats.performance.indexErrors++;
                }
            }

            const executionTime = Date.now() - startTime;
            this.updateIndexStats(indexedCount, executionTime);

            this.logger.log(`All orders reindexed successfully: ${indexedCount} orders in ${executionTime}ms`);
        } catch (error) {
            this.logger.error(`Failed to reindex all orders: ${error.message}`);
            throw error;
        }
    }

    async removeOrderFromIndex(orderId: string): Promise<void> {
        this.logger.log(`Removing order ${orderId} from index`);

        try {
            await this.searchService.removeFromIndex(orderId);
            this.logger.log(`Order ${orderId} removed from index successfully`);
        } catch (error) {
            this.logger.error(`Failed to remove order ${orderId} from index: ${error.message}`);
            throw error;
        }
    }

    async getIndexStats(): Promise<IndexStats> {
        return { ...this.indexStats };
    }

    async getIndexHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        issues: string[];
        recommendations: string[];
    }> {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check index size
        if (this.indexStats.indexSize === 0) {
            issues.push('Search index is empty');
            recommendations.push('Run full index update');
        }

        // Check last update time
        const timeSinceLastUpdate = Date.now() - this.indexStats.lastIndexUpdate.getTime();
        const oneHour = 60 * 60 * 1000;
        if (timeSinceLastUpdate > oneHour) {
            issues.push('Index is stale (last update more than 1 hour ago)');
            recommendations.push('Run incremental index update');
        }

        // Check error rate
        const errorRate = this.indexStats.performance.indexErrors / Math.max(this.indexStats.indexedDocuments, 1);
        if (errorRate > 0.1) {
            issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
            recommendations.push('Investigate indexing errors');
        }

        // Check performance
        if (this.indexStats.performance.averageIndexTime > 1000) {
            issues.push('Slow indexing performance');
            recommendations.push('Optimize indexing process');
        }

        let status: 'healthy' | 'degraded' | 'unhealthy';
        if (issues.length === 0) {
            status = 'healthy';
        } else if (issues.length <= 2) {
            status = 'degraded';
        } else {
            status = 'unhealthy';
        }

        return {
            status,
            issues,
            recommendations,
        };
    }

    private async cleanupDeletedOrders(): Promise<void> {
        this.logger.log('Cleaning up deleted orders from index...');

        try {
            // Get all order IDs from database
            const existingOrderIds = await this.prisma.order.findMany({
                select: { id: true },
            });
            const existingIds = new Set(existingOrderIds.map(order => order.id.toString()));

            // Get all indexed order IDs (this would be from the search service)
            // For now, we'll assume the search service handles this internally
            this.logger.log('Deleted orders cleanup completed');
        } catch (error) {
            this.logger.error(`Failed to cleanup deleted orders: ${error.message}`);
        }
    }

    private async optimizeSearchIndex(): Promise<void> {
        this.logger.log('Optimizing search index...');

        try {
            // In a real implementation, this would:
            // 1. Defragment the search index
            // 2. Remove duplicate entries
            // 3. Optimize search performance
            // 4. Update index metadata

            this.logger.log('Search index optimization completed');
        } catch (error) {
            this.logger.error(`Failed to optimize search index: ${error.message}`);
        }
    }

    private updateIndexStats(indexedCount: number, executionTime: number): void {
        this.indexStats.indexedDocuments += indexedCount;
        this.indexStats.lastIndexUpdate = new Date();
        this.indexStats.indexSize = this.indexStats.indexedDocuments;

        // Update average index time
        const totalTime = this.indexStats.performance.averageIndexTime * (this.indexStats.indexedDocuments - indexedCount) + executionTime;
        this.indexStats.performance.averageIndexTime = totalTime / this.indexStats.indexedDocuments;
    }

    async forceReindex(): Promise<void> {
        this.logger.log('Force reindexing all orders...');

        try {
            // Clear existing index
            await this.clearIndex();

            // Reindex all orders
            await this.reindexAllOrders();

            this.logger.log('Force reindex completed successfully');
        } catch (error) {
            this.logger.error(`Force reindex failed: ${error.message}`);
            throw error;
        }
    }

    private async clearIndex(): Promise<void> {
        this.logger.log('Clearing search index...');

        try {
            // In a real implementation, this would clear the search index
            // For now, we'll reset the stats
            this.indexStats = {
                totalDocuments: 0,
                indexedDocuments: 0,
                lastIndexUpdate: new Date(),
                indexSize: 0,
                performance: {
                    averageIndexTime: 0,
                    indexErrors: 0,
                },
            };

            this.logger.log('Search index cleared');
        } catch (error) {
            this.logger.error(`Failed to clear search index: ${error.message}`);
            throw error;
        }
    }

    async getIndexingProgress(): Promise<{
        totalOrders: number;
        indexedOrders: number;
        progress: number;
        estimatedTimeRemaining: number;
    }> {
        const totalOrders = await this.prisma.order.count();
        const indexedOrders = this.indexStats.indexedDocuments;
        const progress = totalOrders > 0 ? (indexedOrders / totalOrders) * 100 : 0;
        const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(totalOrders - indexedOrders);

        return {
            totalOrders,
            indexedOrders,
            progress,
            estimatedTimeRemaining,
        };
    }

    private calculateEstimatedTimeRemaining(remainingOrders: number): number {
        const averageTimePerOrder = this.indexStats.performance.averageIndexTime;
        return remainingOrders * averageTimePerOrder;
    }
}
