import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
    constructor(private readonly metrics: MetricsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const start = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - start;
                    const route = req.route?.path || req.originalUrl || req.url || 'unknown';
                    this.metrics.observeHttp(req.method, route, res.statusCode, duration);
                },
                error: () => {
                    const duration = Date.now() - start;
                    const route = req.route?.path || req.originalUrl || req.url || 'unknown';
                    const status = res.statusCode || 500;
                    this.metrics.observeHttp(req.method, route, status, duration);
                },
            }),
        );
    }
}


