import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
    private readonly logger = new Logger(PerformanceInterceptor.name);
    private slowThresholdMs = 500; // configurable if needed

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const start = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - start;
                if (duration >= this.slowThresholdMs) {
                    this.logger.warn(`Slow request: ${req.method} ${req.originalUrl || req.url} - ${duration}ms`);
                }
            }),
        );
    }
}


