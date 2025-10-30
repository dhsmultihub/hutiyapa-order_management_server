import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
            // Connection pooling: Add ?connection_limit=10&pool_timeout=20 to DATABASE_URL
            log: [
                { level: 'query', emit: 'event' },
                { level: 'error', emit: 'stdout' },
                { level: 'info', emit: 'stdout' },
                { level: 'warn', emit: 'stdout' },
            ],
        });

        // Query logging in non-production with slow query warning
        const enableLog = process.env.NODE_ENV !== 'production' && process.env.PRISMA_LOG_QUERIES !== 'false';
        const slowMs = Number(process.env.PRISMA_SLOW_QUERY_MS ?? 200);
        if (enableLog) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any).$on('query', (e: any) => {
                const msg = `SQL ${e.duration}ms :: ${e.query}`;
                if (e.duration >= slowMs) {
                    this.logger.warn(`SLOW ${msg}`);
                } else {
                    this.logger.debug(msg);
                }
            });
        }
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Database connected successfully');
        } catch (error) {
            this.logger.error('❌ Failed to connect to database:', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('🔌 Database disconnected successfully');
        } catch (error) {
            this.logger.error('❌ Error disconnecting from database:', error);
        }
    }

    // Health check method
    async isHealthy(): Promise<boolean> {
        try {
            await this.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            this.logger.error('Database health check failed:', error);
            return false;
        }
    }

    // Transaction helper
    async executeTransaction<T>(
        fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>,
    ): Promise<T> {
        return this.$transaction(fn);
    }

    // Cleanup method for testing
    async cleanup() {
        if (process.env.NODE_ENV === 'test') {
            const tablenames = await this.$queryRaw<
                Array<{ tablename: string }>
            >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

            const tables = tablenames
                .map(({ tablename }) => tablename)
                .filter((name) => name !== '_prisma_migrations')
                .map((name) => `"public"."${name}"`)
                .join(', ');

            try {
                await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
                this.logger.log('🧹 Test database cleaned up');
            } catch (error) {
                this.logger.error('❌ Error cleaning up test database:', error);
            }
        }
    }
}
