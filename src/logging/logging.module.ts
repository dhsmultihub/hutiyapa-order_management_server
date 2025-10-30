import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { AuditService } from './audit.service';

@Module({
    providers: [LoggingService, AuditService],
    exports: [LoggingService, AuditService],
})
export class LoggingModule { }
