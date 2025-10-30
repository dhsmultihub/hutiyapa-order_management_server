import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type CacheValue = {
    value: any;
    expiresAt: number; // epoch ms
};

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private readonly ttlMsDefault: number;
    private memoryStore = new Map<string, CacheValue>();
    private redis?: any; // lazy optional ioredis instance

    constructor(private readonly config: ConfigService) {
        this.ttlMsDefault = Number(this.config.get('CACHE_TTL_MS', 30_000));
        const redisUrl = this.config.get<string>('REDIS_URL');
        if (redisUrl) {
            try {
                // Use require to avoid hard dep if not installed
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const IORedis = require('ioredis');
                this.redis = new IORedis(redisUrl, {
                    lazyConnect: true,
                    maxRetriesPerRequest: 1,
                });
                this.redis.connect?.().catch((err: any) => {
                    this.logger.warn(`Redis connect deferred: ${err?.message}`);
                });
                this.logger.log('Redis client initialized');
            } catch (err: any) {
                this.logger.warn(`Redis not available, falling back to in-memory cache: ${err?.message}`);
                this.redis = undefined;
            }
        } else {
            this.logger.log('REDIS_URL not set, using in-memory cache');
        }
    }

    private buildKey(namespace: string, key: string): string {
        return `${namespace}:${key}`;
    }

    async get<T = any>(namespace: string, key: string): Promise<T | undefined> {
        const fullKey = this.buildKey(namespace, key);
        if (this.redis) {
            const raw = await this.redis.get(fullKey);
            if (!raw) return undefined;
            try {
                return JSON.parse(raw) as T;
            } catch {
                return undefined;
            }
        }
        const entry = this.memoryStore.get(fullKey);
        if (!entry) return undefined;
        if (Date.now() > entry.expiresAt) {
            this.memoryStore.delete(fullKey);
            return undefined;
        }
        return entry.value as T;
    }

    async set(namespace: string, key: string, value: any, ttlMs?: number): Promise<void> {
        const fullKey = this.buildKey(namespace, key);
        const ttl = ttlMs ?? this.ttlMsDefault;
        if (this.redis) {
            await this.redis.set(fullKey, JSON.stringify(value), 'PX', ttl);
            return;
        }
        this.memoryStore.set(fullKey, { value, expiresAt: Date.now() + ttl });
    }

    async del(namespace: string, key: string): Promise<void> {
        const fullKey = this.buildKey(namespace, key);
        if (this.redis) {
            await this.redis.del(fullKey);
            return;
        }
        this.memoryStore.delete(fullKey);
    }

    async wrap<T = any>(namespace: string, key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
        const cached = await this.get<T>(namespace, key);
        if (cached !== undefined) return cached;
        const result = await fn();
        await this.set(namespace, key, result, ttlMs);
        return result;
    }

    async isHealthy(): Promise<boolean> {
        try {
            if (this.redis) {
                const pong = await this.redis.ping?.();
                return pong === 'PONG';
            }
            // In-memory cache is considered healthy by default
            return true;
        } catch (err) {
            this.logger.warn(`Redis health check failed: ${err?.message}`);
            return false;
        }
    }
}
