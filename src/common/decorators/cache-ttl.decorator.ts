import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_MS_KEY = 'cache_ttl_ms';

export const CacheTtl = (ttlMs: number) => SetMetadata(CACHE_TTL_MS_KEY, ttlMs);


