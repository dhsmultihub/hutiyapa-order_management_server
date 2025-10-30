import { Injectable } from '@nestjs/common';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

@Injectable()
export class LoggingService {
    private readonly logger: WinstonLogger;

    constructor() {
        this.logger = createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: format.combine(
                format.timestamp(),
                format.errors({ stack: true }),
                format.json(),
            ),
            defaultMeta: { service: 'order-management-service' },
            transports: [
                new transports.Console({
                    format: format.combine(
                        format.colorize({ all: false }),
                        format.timestamp(),
                        format.json(),
                    ),
                }),
            ],
        });
    }

    private withCorrelation(meta?: Record<string, any>) {
        return { ...meta };
    }

    info(message: string, meta?: Record<string, any>) {
        this.logger.info(message, this.withCorrelation(meta));
    }

    warn(message: string, meta?: Record<string, any>) {
        this.logger.warn(message, this.withCorrelation(meta));
    }

    error(message: string, meta?: Record<string, any>) {
        this.logger.error(message, this.withCorrelation(meta));
    }

    debug(message: string, meta?: Record<string, any>) {
        this.logger.debug(message, this.withCorrelation(meta));
    }
}
