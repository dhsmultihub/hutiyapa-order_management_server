import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const http = context.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();

        const headerName = 'x-correlation-id';
        const incomingId = request.headers[headerName] as string | undefined;
        const correlationId = incomingId || uuidv4();

        request.correlationId = correlationId;
        response.setHeader('X-Correlation-Id', correlationId);

        return next.handle();
    }
}

declare module 'http' {
    interface IncomingMessage {
        correlationId?: string;
    }
}


