import { Injectable, Logger } from '@nestjs/common';
import { SupportTicketService } from './services/support-ticket.service';
import { ReturnManagementService } from './services/return-management.service';
import { CommunicationService } from './services/communication.service';
import { SupportAnalyticsService } from './services/support-analytics.service';
import { CreateSupportTicketDto, UpdateSupportTicketDto, SupportTicketResponseDto, TicketCommentDto, CreateTicketCommentDto, TicketQueryDto } from './dto/support-ticket.dto';
import { CreateReturnRequestDto, UpdateReturnRequestDto, ReturnRequestResponseDto, ReturnQueryDto } from './dto/return-request.dto';
import { SupportMetrics, ReturnMetrics, CustomerSupportSummary } from './services/support-analytics.service';

@Injectable()
export class SupportService {
    private readonly logger = new Logger(SupportService.name);

    constructor(
        private readonly supportTicketService: SupportTicketService,
        private readonly returnManagementService: ReturnManagementService,
        private readonly communicationService: CommunicationService,
        private readonly supportAnalyticsService: SupportAnalyticsService,
    ) { }

    // Support Ticket Methods
    async createTicket(createTicketDto: CreateSupportTicketDto): Promise<SupportTicketResponseDto> {
        this.logger.log(`Creating support ticket for customer ${createTicketDto.customerId}`);

        const ticket = await this.supportTicketService.createTicket(createTicketDto);

        // Send notification
        await this.communicationService.sendSupportTicketNotification(
            ticket.id,
            ticket.customerEmail,
            ticket
        );

        return ticket;
    }

    async getTicket(ticketId: string): Promise<SupportTicketResponseDto> {
        this.logger.log(`Getting support ticket ${ticketId}`);
        return this.supportTicketService.getTicket(ticketId);
    }

    async getTickets(query: TicketQueryDto): Promise<{ tickets: SupportTicketResponseDto[]; total: number; page: number; limit: number }> {
        this.logger.log('Getting support tickets with filters');
        return this.supportTicketService.getTickets(query);
    }

    async updateTicket(ticketId: string, updateTicketDto: UpdateSupportTicketDto): Promise<SupportTicketResponseDto> {
        this.logger.log(`Updating support ticket ${ticketId}`);
        return this.supportTicketService.updateTicket(ticketId, updateTicketDto);
    }

    async addComment(ticketId: string, createCommentDto: CreateTicketCommentDto, commenterId: string, commenterType: 'CUSTOMER' | 'AGENT' | 'SYSTEM'): Promise<TicketCommentDto> {
        this.logger.log(`Adding comment to ticket ${ticketId}`);
        return this.supportTicketService.addComment(ticketId, createCommentDto, commenterId, commenterType);
    }

    async getComments(ticketId: string): Promise<TicketCommentDto[]> {
        this.logger.log(`Getting comments for ticket ${ticketId}`);
        return this.supportTicketService.getComments(ticketId);
    }

    async getTicketStats(): Promise<any> {
        this.logger.log('Getting support ticket statistics');
        return this.supportTicketService.getTicketStats();
    }

    // Return Management Methods
    async createReturnRequest(createReturnDto: CreateReturnRequestDto): Promise<ReturnRequestResponseDto> {
        this.logger.log(`Creating return request for order ${createReturnDto.orderId}`);

        const returnRequest = await this.returnManagementService.createReturnRequest(createReturnDto);

        // Send notification
        await this.communicationService.sendReturnRequestNotification(
            returnRequest.id,
            'customer@example.com', // Would get from order data
            returnRequest
        );

        return returnRequest;
    }

    async getReturnRequest(returnId: string): Promise<ReturnRequestResponseDto> {
        this.logger.log(`Getting return request ${returnId}`);
        return this.returnManagementService.getReturnRequest(returnId);
    }

    async getReturnRequests(query: ReturnQueryDto): Promise<{ returns: ReturnRequestResponseDto[]; total: number; page: number; limit: number }> {
        this.logger.log('Getting return requests with filters');
        return this.returnManagementService.getReturnRequests(query);
    }

    async updateReturnRequest(returnId: string, updateReturnDto: UpdateReturnRequestDto): Promise<ReturnRequestResponseDto> {
        this.logger.log(`Updating return request ${returnId}`);
        return this.returnManagementService.updateReturnRequest(returnId, updateReturnDto);
    }

    async approveReturnRequest(returnId: string, adminNotes?: string): Promise<ReturnRequestResponseDto> {
        this.logger.log(`Approving return request ${returnId}`);
        return this.returnManagementService.approveReturnRequest(returnId, adminNotes);
    }

    async rejectReturnRequest(returnId: string, adminNotes: string): Promise<ReturnRequestResponseDto> {
        this.logger.log(`Rejecting return request ${returnId}`);
        return this.returnManagementService.rejectReturnRequest(returnId, adminNotes);
    }

    async processReturn(returnId: string, processingNotes?: string): Promise<ReturnRequestResponseDto> {
        this.logger.log(`Processing return request ${returnId}`);
        return this.returnManagementService.processReturn(returnId, processingNotes);
    }

    async getReturnStats(): Promise<any> {
        this.logger.log('Getting return request statistics');
        return this.returnManagementService.getReturnStats();
    }

    // Communication Methods
    async sendOrderConfirmation(orderId: string, customerEmail: string, orderData: any): Promise<void> {
        this.logger.log(`Sending order confirmation for order ${orderId}`);
        return this.communicationService.sendOrderConfirmation(orderId, customerEmail, orderData);
    }

    async sendShippingNotification(orderId: string, customerEmail: string, trackingData: any): Promise<void> {
        this.logger.log(`Sending shipping notification for order ${orderId}`);
        return this.communicationService.sendShippingNotification(orderId, customerEmail, trackingData);
    }

    async sendDeliveryConfirmation(orderId: string, customerEmail: string, deliveryData: any): Promise<void> {
        this.logger.log(`Sending delivery confirmation for order ${orderId}`);
        return this.communicationService.sendDeliveryConfirmation(orderId, customerEmail, deliveryData);
    }

    async sendSMS(phoneNumber: string, message: string): Promise<void> {
        this.logger.log(`Sending SMS to ${phoneNumber}`);
        return this.communicationService.sendSMS(phoneNumber, message);
    }

    async sendPushNotification(userId: string, title: string, message: string, data?: Record<string, any>): Promise<void> {
        this.logger.log(`Sending push notification to user ${userId}`);
        return this.communicationService.sendPushNotification(userId, title, message, data);
    }

    // Analytics Methods
    async getSupportMetrics(dateRange?: { start: Date; end: Date }): Promise<SupportMetrics> {
        this.logger.log('Getting support metrics');
        return this.supportAnalyticsService.getSupportMetrics(dateRange);
    }

    async getReturnMetrics(dateRange?: { start: Date; end: Date }): Promise<ReturnMetrics> {
        this.logger.log('Getting return metrics');
        return this.supportAnalyticsService.getReturnMetrics(dateRange);
    }

    async getCustomerSupportSummary(customerId: string): Promise<CustomerSupportSummary> {
        this.logger.log(`Getting customer support summary for customer ${customerId}`);
        return this.supportAnalyticsService.getCustomerSupportSummary(customerId);
    }

    async getTopIssues(limit: number = 10): Promise<Array<{ category: string; count: number; percentage: number }>> {
        this.logger.log(`Getting top ${limit} issues`);
        return this.supportAnalyticsService.getTopIssues(limit);
    }

    async getAgentPerformance(agentId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
        this.logger.log(`Getting agent performance for agent ${agentId}`);
        return this.supportAnalyticsService.getAgentPerformance(agentId, dateRange);
    }
}
