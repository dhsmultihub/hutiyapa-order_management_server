import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateSupportTicketDto, UpdateSupportTicketDto, SupportTicketResponseDto, TicketCommentDto, CreateTicketCommentDto, TicketQueryDto } from './dto/support-ticket.dto';
import { CreateReturnRequestDto, UpdateReturnRequestDto, ReturnRequestResponseDto, ReturnQueryDto } from './dto/return-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    // Support Ticket Endpoints
    @Post('tickets')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create a new support ticket' })
    @ApiResponse({ status: 201, description: 'Support ticket created successfully', type: SupportTicketResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid ticket data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async createTicket(
        @Body() createTicketDto: CreateSupportTicketDto,
        @CurrentUser() user: any
    ): Promise<SupportTicketResponseDto> {
        return this.supportService.createTicket(createTicketDto);
    }

    @Get('tickets/:id')
    @ApiParam({ name: 'id', description: 'Ticket ID', example: '1' })
    @ApiOperation({ summary: 'Get support ticket by ID' })
    @ApiResponse({ status: 200, description: 'Support ticket retrieved successfully', type: SupportTicketResponseDto })
    @ApiResponse({ status: 404, description: 'Support ticket not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getTicket(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<SupportTicketResponseDto> {
        return this.supportService.getTicket(id);
    }

    @Get('tickets')
    @ApiOperation({ summary: 'Get support tickets with filters' })
    @ApiResponse({ status: 200, description: 'Support tickets retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getTickets(
        @Query() query: TicketQueryDto,
        @CurrentUser() user: any
    ): Promise<{ tickets: SupportTicketResponseDto[]; total: number; page: number; limit: number }> {
        return this.supportService.getTickets(query);
    }

    @Put('tickets/:id')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiParam({ name: 'id', description: 'Ticket ID', example: '1' })
    @ApiOperation({ summary: 'Update support ticket' })
    @ApiResponse({ status: 200, description: 'Support ticket updated successfully', type: SupportTicketResponseDto })
    @ApiResponse({ status: 404, description: 'Support ticket not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async updateTicket(
        @Param('id') id: string,
        @Body() updateTicketDto: UpdateSupportTicketDto,
        @CurrentUser() user: any
    ): Promise<SupportTicketResponseDto> {
        return this.supportService.updateTicket(id, updateTicketDto);
    }

    @Post('tickets/:id/comments')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiParam({ name: 'id', description: 'Ticket ID', example: '1' })
    @ApiOperation({ summary: 'Add comment to support ticket' })
    @ApiResponse({ status: 201, description: 'Comment added successfully', type: TicketCommentDto })
    @ApiResponse({ status: 400, description: 'Invalid comment data' })
    @ApiResponse({ status: 404, description: 'Support ticket not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async addComment(
        @Param('id') id: string,
        @Body() createCommentDto: CreateTicketCommentDto,
        @CurrentUser() user: any
    ): Promise<TicketCommentDto> {
        return this.supportService.addComment(id, createCommentDto, user.id, 'CUSTOMER');
    }

    @Get('tickets/:id/comments')
    @ApiParam({ name: 'id', description: 'Ticket ID', example: '1' })
    @ApiOperation({ summary: 'Get comments for support ticket' })
    @ApiResponse({ status: 200, description: 'Comments retrieved successfully', type: [TicketCommentDto] })
    @ApiResponse({ status: 404, description: 'Support ticket not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getComments(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<TicketCommentDto[]> {
        return this.supportService.getComments(id);
    }

    @Get('tickets/stats')
    @ApiOperation({ summary: 'Get support ticket statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getTicketStats(
        @CurrentUser() user: any
    ): Promise<any> {
        return this.supportService.getTicketStats();
    }

    // Return Request Endpoints
    @Post('returns')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create a new return request' })
    @ApiResponse({ status: 201, description: 'Return request created successfully', type: ReturnRequestResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid return request data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async createReturnRequest(
        @Body() createReturnDto: CreateReturnRequestDto,
        @CurrentUser() user: any
    ): Promise<ReturnRequestResponseDto> {
        return this.supportService.createReturnRequest(createReturnDto);
    }

    @Get('returns/:id')
    @ApiParam({ name: 'id', description: 'Return request ID', example: '1' })
    @ApiOperation({ summary: 'Get return request by ID' })
    @ApiResponse({ status: 200, description: 'Return request retrieved successfully', type: ReturnRequestResponseDto })
    @ApiResponse({ status: 404, description: 'Return request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getReturnRequest(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<ReturnRequestResponseDto> {
        return this.supportService.getReturnRequest(id);
    }

    @Get('returns')
    @ApiOperation({ summary: 'Get return requests with filters' })
    @ApiResponse({ status: 200, description: 'Return requests retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getReturnRequests(
        @Query() query: ReturnQueryDto,
        @CurrentUser() user: any
    ): Promise<{ returns: ReturnRequestResponseDto[]; total: number; page: number; limit: number }> {
        return this.supportService.getReturnRequests(query);
    }

    @Put('returns/:id')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiParam({ name: 'id', description: 'Return request ID', example: '1' })
    @ApiOperation({ summary: 'Update return request' })
    @ApiResponse({ status: 200, description: 'Return request updated successfully', type: ReturnRequestResponseDto })
    @ApiResponse({ status: 404, description: 'Return request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async updateReturnRequest(
        @Param('id') id: string,
        @Body() updateReturnDto: UpdateReturnRequestDto,
        @CurrentUser() user: any
    ): Promise<ReturnRequestResponseDto> {
        return this.supportService.updateReturnRequest(id, updateReturnDto);
    }

    @Post('returns/:id/approve')
    @ApiParam({ name: 'id', description: 'Return request ID', example: '1' })
    @ApiOperation({ summary: 'Approve return request' })
    @ApiResponse({ status: 200, description: 'Return request approved successfully', type: ReturnRequestResponseDto })
    @ApiResponse({ status: 404, description: 'Return request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async approveReturnRequest(
        @Param('id') id: string,
        @Body() approvalData: { adminNotes?: string },
        @CurrentUser() user: any
    ): Promise<ReturnRequestResponseDto> {
        return this.supportService.approveReturnRequest(id, approvalData.adminNotes);
    }

    @Post('returns/:id/reject')
    @ApiParam({ name: 'id', description: 'Return request ID', example: '1' })
    @ApiOperation({ summary: 'Reject return request' })
    @ApiResponse({ status: 200, description: 'Return request rejected successfully', type: ReturnRequestResponseDto })
    @ApiResponse({ status: 404, description: 'Return request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async rejectReturnRequest(
        @Param('id') id: string,
        @Body() rejectionData: { adminNotes: string },
        @CurrentUser() user: any
    ): Promise<ReturnRequestResponseDto> {
        return this.supportService.rejectReturnRequest(id, rejectionData.adminNotes);
    }

    @Post('returns/:id/process')
    @ApiParam({ name: 'id', description: 'Return request ID', example: '1' })
    @ApiOperation({ summary: 'Process return request' })
    @ApiResponse({ status: 200, description: 'Return request processed successfully', type: ReturnRequestResponseDto })
    @ApiResponse({ status: 404, description: 'Return request not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async processReturn(
        @Param('id') id: string,
        @Body() processingData: { processingNotes?: string },
        @CurrentUser() user: any
    ): Promise<ReturnRequestResponseDto> {
        return this.supportService.processReturn(id, processingData.processingNotes);
    }

    @Get('returns/stats')
    @ApiOperation({ summary: 'Get return request statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getReturnStats(
        @CurrentUser() user: any
    ): Promise<any> {
        return this.supportService.getReturnStats();
    }

    // Analytics Endpoints
    @Get('analytics/support-metrics')
    @ApiOperation({ summary: 'Get support metrics' })
    @ApiResponse({ status: 200, description: 'Support metrics retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getSupportMetrics(
        @CurrentUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ): Promise<any> {
        const dateRange = startDate && endDate ? {
            start: new Date(startDate),
            end: new Date(endDate),
        } : undefined;

        return this.supportService.getSupportMetrics(dateRange);
    }

    @Get('analytics/return-metrics')
    @ApiOperation({ summary: 'Get return metrics' })
    @ApiResponse({ status: 200, description: 'Return metrics retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getReturnMetrics(
        @CurrentUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ): Promise<any> {
        const dateRange = startDate && endDate ? {
            start: new Date(startDate),
            end: new Date(endDate),
        } : undefined;

        return this.supportService.getReturnMetrics(dateRange);
    }

    @Get('analytics/customer/:customerId')
    @ApiParam({ name: 'customerId', description: 'Customer ID', example: '1' })
    @ApiOperation({ summary: 'Get customer support summary' })
    @ApiResponse({ status: 200, description: 'Customer support summary retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Customer not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getCustomerSupportSummary(
        @Param('customerId') customerId: string,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.supportService.getCustomerSupportSummary(customerId);
    }

    @Get('analytics/top-issues')
    @ApiQuery({ name: 'limit', description: 'Number of top issues to return', required: false, example: 10 })
    @ApiOperation({ summary: 'Get top issues' })
    @ApiResponse({ status: 200, description: 'Top issues retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getTopIssues(
        @CurrentUser() user: any,
        @Query('limit') limit?: number
    ): Promise<any> {
        return this.supportService.getTopIssues(limit);
    }

    @Get('analytics/agent-performance/:agentId')
    @ApiParam({ name: 'agentId', description: 'Agent ID', example: '1' })
    @ApiOperation({ summary: 'Get agent performance metrics' })
    @ApiResponse({ status: 200, description: 'Agent performance metrics retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Agent not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getAgentPerformance(
        @Param('agentId') agentId: string,
        @CurrentUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ): Promise<any> {
        const dateRange = startDate && endDate ? {
            start: new Date(startDate),
            end: new Date(endDate),
        } : undefined;

        return this.supportService.getAgentPerformance(agentId, dateRange);
    }
}
