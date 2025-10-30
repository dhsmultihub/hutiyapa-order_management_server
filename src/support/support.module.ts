import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportTicketService } from './services/support-ticket.service';
import { ReturnManagementService } from './services/return-management.service';
import { CommunicationService } from './services/communication.service';
import { SupportAnalyticsService } from './services/support-analytics.service';

@Module({
    controllers: [SupportController],
    providers: [
        SupportService,
        SupportTicketService,
        ReturnManagementService,
        CommunicationService,
        SupportAnalyticsService,
    ],
    exports: [SupportService, SupportTicketService, ReturnManagementService, CommunicationService, SupportAnalyticsService],
})
export class SupportModule { }
