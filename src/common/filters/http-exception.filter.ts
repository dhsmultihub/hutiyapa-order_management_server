import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
    Inject,
    Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorTrackingService } from '../../monitoring/error-tracking.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    constructor(
        @Optional() @Inject(ErrorTrackingService) private readonly errorTracking?: ErrorTrackingService,
    ) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string | string[];
        let error: string;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                error = exception.name;
            } else {
                message = (exceptionResponse as any).message || exception.message;
                error = (exceptionResponse as any).error || exception.name;
            }
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = 'InternalServerError';
        }

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            error,
            message,
            ...(process.env.NODE_ENV === 'development' && {
                stack: exception instanceof Error ? exception.stack : undefined,
            }),
        };

        // Log the error
        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${message}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        // Track errors with Sentry/error tracking (only 5xx errors)
        if (status >= 500 && exception instanceof Error && this.errorTracking) {
            this.errorTracking.captureException(exception, {
                request: {
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                },
                response: {
                    statusCode: status,
                },
            });
        }

        response.status(status).json(errorResponse);
    }
}
