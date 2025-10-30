import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface QueryOptimizationStats {
    totalQueries: number;
    slowQueries: number;
    averageQueryTime: number;
    cacheHitRate: number;
}

@Injectable()
export class QueryOptimizerService {
    private readonly logger = new Logger(QueryOptimizerService.name);
    private queryStats = {
        total: 0,
        slow: 0,
        totalTime: 0,
    };

    constructor(private readonly prisma: PrismaService) { }

    // Optimized order query with selective field loading
    async findOrdersOptimized(where: any, options: {
        page?: number;
        limit?: number;
        includeItems?: boolean;
        includePayments?: boolean;
        includeShipments?: boolean;
    } = {}) {
        const { page = 1, limit = 20, includeItems = true, includePayments = false, includeShipments = false } = options;

        // Build selective include based on needs
        const include: any = {};
        if (includeItems) include.orderItems = true;
        if (includePayments) include.payments = { take: 5 }; // Limit related records
        if (includeShipments) include.shipments = { take: 5 };

        const [orders, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);

        return { orders, total, page, limit };
    }

    // Batch load orders to avoid N+1 queries
    async batchLoadOrders(orderIds: string[]) {
        const ids = orderIds.map(id => BigInt(id));

        // Single query to get all orders with relations
        const orders = await this.prisma.order.findMany({
            where: { id: { in: ids } },
            include: {
                orderItems: true,
                payments: { take: 5 },
                shipments: { take: 5 },
            },
        });

        // Return as map for O(1) lookup
        return new Map(orders.map(order => [order.id.toString(), order]));
    }

    // Aggregate query with proper indexing
    async getOrderAggregates(where: any) {
        return this.prisma.order.aggregate({
            where,
            _count: { id: true },
            _sum: { totalAmount: true },
            _avg: { totalAmount: true },
            _min: { createdAt: true },
            _max: { createdAt: true },
        });
    }

    // Efficient count with query optimization
    async getOrderCount(where: any) {
        // Use approximate count for large datasets in production
        if (process.env.NODE_ENV === 'production' && !where) {
            // Fast approximate count using pg_stat
            const result = await this.prisma.$queryRaw<[{ approximate_count: bigint }]>`
        SELECT reltuples::bigint AS approximate_count
        FROM pg_class
        WHERE relname = 'orders'
      `;
            return Number(result[0]?.approximate_count ?? 0);
        }

        return this.prisma.order.count({ where });
    }

    // Query with cursor-based pagination for better performance
    async findOrdersCursor(where: any, cursor?: string, limit: number = 20) {
        const orders = await this.prisma.order.findMany({
            where,
            take: limit + 1, // Fetch one extra to determine if there are more
            cursor: cursor ? { id: BigInt(cursor) } : undefined,
            orderBy: { id: 'desc' },
            include: {
                orderItems: true,
            },
        });

        const hasMore = orders.length > limit;
        const results = hasMore ? orders.slice(0, -1) : orders;
        const nextCursor = hasMore ? results[results.length - 1].id.toString() : null;

        return { orders: results, nextCursor, hasMore };
    }

    // Record query performance
    recordQuery(duration: number, isSlow: boolean) {
        this.queryStats.total++;
        this.queryStats.totalTime += duration;
        if (isSlow) this.queryStats.slow++;
    }

    // Get query statistics
    getQueryStats(): QueryOptimizationStats {
        return {
            totalQueries: this.queryStats.total,
            slowQueries: this.queryStats.slow,
            averageQueryTime: this.queryStats.total > 0
                ? this.queryStats.totalTime / this.queryStats.total
                : 0,
            cacheHitRate: 0, // Will be populated by cache service
        };
    }

    // Analyze query performance
    async analyzeQueryPerformance() {
        try {
            // Get slow queries from PostgreSQL
            const slowQueries = await this.prisma.$queryRaw<Array<{
                query: string;
                calls: bigint;
                total_time: number;
                mean_time: number;
            }>>`
        SELECT query, calls, total_time, mean_time
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `;

            return slowQueries.map(sq => ({
                query: sq.query,
                calls: Number(sq.calls),
                totalTime: sq.total_time,
                meanTime: sq.mean_time,
            }));
        } catch (error) {
            this.logger.warn('pg_stat_statements not available for query analysis');
            return [];
        }
    }

    // Suggest indexes based on query patterns
    async suggestIndexes() {
        const suggestions: string[] = [];

        try {
            // Analyze missing indexes
            const missingIndexes = await this.prisma.$queryRaw<Array<{
                tablename: string;
                attname: string;
                n_distinct: number;
            }>>`
        SELECT 
          schemaname || '.' || tablename AS tablename,
          attname,
          n_distinct
        FROM pg_stats
        WHERE schemaname = 'public'
          AND n_distinct > 100
          AND attname NOT IN (
            SELECT a.attname
            FROM pg_class c
            JOIN pg_index i ON i.indrelid = c.oid
            JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
            WHERE c.relname = tablename
          )
        LIMIT 10
      `;

            for (const idx of missingIndexes) {
                suggestions.push(`CREATE INDEX idx_${idx.tablename}_${idx.attname} ON ${idx.tablename}(${idx.attname})`);
            }
        } catch (error) {
            this.logger.warn('Unable to analyze missing indexes');
        }

        return suggestions;
    }

    // Clear query statistics
    clearStats() {
        this.queryStats = {
            total: 0,
            slow: 0,
            totalTime: 0,
        };
    }
}

