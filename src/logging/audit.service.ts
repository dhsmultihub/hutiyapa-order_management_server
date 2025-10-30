import { Injectable } from '@nestjs/common';
import { LoggingService } from './logging.service';

@Injectable()
export class AuditService {
    constructor(private readonly logger: LoggingService) { }

    record(event: string, data: Record<string, any> = {}) {
        this.logger.info(`AUDIT:${event}`, data);
    }
}


