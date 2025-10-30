import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
    path: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        const request = context.switchToHttp().getRequest();
        const { url, method } = request;

        return next.handle().pipe(
            map((data) => ({
                success: true,
                data,
                message: 'Operation completed successfully',
                timestamp: new Date().toISOString(),
                path: url,
            })),
        );
    }
}
