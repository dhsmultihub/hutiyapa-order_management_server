import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { CacheService } from '../../cache/cache.service';
import { Reflector } from '@nestjs/core';
import { CACHE_TTL_MS_KEY } from '../decorators/cache-ttl.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    constructor(
        private readonly cache: CacheService,
        private readonly reflector: Reflector,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        // Only cache GET requests
        if (req.method !== 'GET') {
            return next.handle();
        }

        const key = this.buildKey(req);
        const routeTtl = this.reflector.getAllAndOverride<number>(CACHE_TTL_MS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const ttlMs = routeTtl ?? Number(req.headers['x-cache-ttl-ms'] ?? 30_000);

        return from(this.cache.get('resp', key)).pipe(
            switchMap((cached) => {
                if (cached !== undefined) {
                    res.setHeader('X-Cache', 'HIT');
                    return from(Promise.resolve(cached));
                }
                res.setHeader('X-Cache', 'MISS');
                return next.handle().pipe(
                    tap(async (data) => {
                        await this.cache.set('resp', key, data, ttlMs);
                    }),
                );
            }),
        );
    }

    private buildKey(req: any): string {
        const url = req.originalUrl || req.url;
        const userId = req.user?.sub ?? 'anon';
        return `${userId}:${url}`;
    }
}


