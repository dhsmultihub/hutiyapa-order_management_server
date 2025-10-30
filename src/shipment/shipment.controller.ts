import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ShipmentService } from './shipment.service';
import { ShipmentRequestDto } from './dto/shipment-request.dto';
import { TrackingUpdateDto } from './dto/tracking-update.dto';
import { ShipmentResponseDto, TrackingEventDto, ShipmentSummaryDto, ShippingRateDto } from './dto/shipment-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ShipmentController {
    constructor(private readonly shipmentService: ShipmentService) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create a new shipment' })
    @ApiResponse({ status: 201, description: 'Shipment created successfully', type: ShipmentResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid shipment data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async createShipment(
        @Body() shipmentRequest: ShipmentRequestDto,
        @CurrentUser() user: any
    ): Promise<ShipmentResponseDto> {
        return this.shipmentService.createShipment(shipmentRequest);
    }

    @Get(':id')
    @Public()
    @ApiParam({ name: 'id', description: 'Shipment ID', example: '1' })
    @ApiOperation({ summary: 'Get shipment by ID' })
    @ApiResponse({ status: 200, description: 'Shipment retrieved successfully', type: ShipmentResponseDto })
    @ApiResponse({ status: 404, description: 'Shipment not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getShipment(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<ShipmentResponseDto> {
        return this.shipmentService.getShipment(id);
    }

    @Get('order/:orderId')
    @Public()
    @ApiParam({ name: 'orderId', description: 'Order ID', example: '1' })
    @ApiOperation({ summary: 'Get shipments by order ID' })
    @ApiResponse({ status: 200, description: 'Shipments retrieved successfully', type: [ShipmentResponseDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getShipmentsByOrder(
        @Param('orderId') orderId: string,
        @CurrentUser() user: any
    ): Promise<ShipmentResponseDto[]> {
        return this.shipmentService.getShipmentsByOrder(orderId);
    }

    @Put(':id/status')
    @ApiParam({ name: 'id', description: 'Shipment ID', example: '1' })
    @ApiOperation({ summary: 'Update shipment status' })
    @ApiResponse({ status: 200, description: 'Shipment status updated successfully', type: ShipmentResponseDto })
    @ApiResponse({ status: 404, description: 'Shipment not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async updateShipmentStatus(
        @Param('id') id: string,
        @Body() statusUpdate: { status: string },
        @CurrentUser() user: any
    ): Promise<ShipmentResponseDto> {
        return this.shipmentService.updateShipmentStatus(id, statusUpdate.status);
    }

    @Get('track/:trackingNumber')
    @ApiParam({ name: 'trackingNumber', description: 'Tracking number', example: 'BD1234567890' })
    @ApiOperation({ summary: 'Track shipment by tracking number' })
    @ApiResponse({ status: 200, description: 'Tracking information retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Shipment not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async trackShipment(
        @Param('trackingNumber') trackingNumber: string,
        @CurrentUser() user: any
    ): Promise<any> {
        return this.shipmentService.trackShipment(trackingNumber);
    }

    @Post(':id/tracking-event')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiParam({ name: 'id', description: 'Shipment ID', example: '1' })
    @ApiOperation({ summary: 'Add tracking event to shipment' })
    @ApiResponse({ status: 201, description: 'Tracking event added successfully', type: TrackingEventDto })
    @ApiResponse({ status: 400, description: 'Invalid tracking event data' })
    @ApiResponse({ status: 404, description: 'Shipment not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async addTrackingEvent(
        @Param('id') id: string,
        @Body() trackingUpdate: TrackingUpdateDto,
        @CurrentUser() user: any
    ): Promise<TrackingEventDto> {
        return this.shipmentService.addTrackingEvent(id, trackingUpdate);
    }

    @Get(':id/tracking-events')
    @ApiParam({ name: 'id', description: 'Shipment ID', example: '1' })
    @ApiOperation({ summary: 'Get tracking events for shipment' })
    @ApiResponse({ status: 200, description: 'Tracking events retrieved successfully', type: [TrackingEventDto] })
    @ApiResponse({ status: 404, description: 'Shipment not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getTrackingEvents(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<TrackingEventDto[]> {
        return this.shipmentService.getTrackingEvents(id);
    }

    @Post(':id/confirm-delivery')
    @ApiParam({ name: 'id', description: 'Shipment ID', example: '1' })
    @ApiOperation({ summary: 'Confirm delivery of shipment' })
    @ApiResponse({ status: 200, description: 'Delivery confirmed successfully' })
    @ApiResponse({ status: 404, description: 'Shipment not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async confirmDelivery(
        @Param('id') id: string,
        @Body() deliveryData: { deliveryNotes?: string },
        @CurrentUser() user: any
    ): Promise<void> {
        return this.shipmentService.confirmDelivery(id, deliveryData.deliveryNotes);
    }

    @Post(':id/report-issue')
    @ApiParam({ name: 'id', description: 'Shipment ID', example: '1' })
    @ApiOperation({ summary: 'Report delivery issue' })
    @ApiResponse({ status: 200, description: 'Delivery issue reported successfully' })
    @ApiResponse({ status: 404, description: 'Shipment not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async reportDeliveryIssue(
        @Param('id') id: string,
        @Body() issueData: { issue: string; notes?: string },
        @CurrentUser() user: any
    ): Promise<void> {
        return this.shipmentService.reportDeliveryIssue(id, issueData.issue, issueData.notes);
    }

    @Post(':id/reschedule')
    @ApiParam({ name: 'id', description: 'Shipment ID', example: '1' })
    @ApiOperation({ summary: 'Reschedule delivery' })
    @ApiResponse({ status: 200, description: 'Delivery rescheduled successfully' })
    @ApiResponse({ status: 404, description: 'Shipment not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async rescheduleDelivery(
        @Param('id') id: string,
        @Body() rescheduleData: { newDeliveryDate: string; reason: string },
        @CurrentUser() user: any
    ): Promise<void> {
        return this.shipmentService.rescheduleDelivery(id, new Date(rescheduleData.newDeliveryDate), rescheduleData.reason);
    }

    @Get('summary')
    @ApiQuery({ name: 'orderId', description: 'Order ID to filter by', required: false, example: '1' })
    @ApiOperation({ summary: 'Get delivery summary' })
    @ApiResponse({ status: 200, description: 'Delivery summary retrieved successfully', type: ShipmentSummaryDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getDeliverySummary(
        @CurrentUser() user: any,
        @Query('orderId') orderId?: string
    ): Promise<ShipmentSummaryDto> {
        return this.shipmentService.getDeliverySummary(orderId);
    }

    @Get('delayed')
    @ApiOperation({ summary: 'Get delayed shipments' })
    @ApiResponse({ status: 200, description: 'Delayed shipments retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getDelayedShipments(
        @CurrentUser() user: any
    ): Promise<any[]> {
        return this.shipmentService.getDelayedShipments();
    }

    @Post('rates')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Get shipping rates' })
    @ApiResponse({ status: 200, description: 'Shipping rates retrieved successfully', type: [ShippingRateDto] })
    @ApiResponse({ status: 400, description: 'Invalid shipment data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getShippingRates(
        @Body() shipmentRequest: ShipmentRequestDto,
        @CurrentUser() user: any
    ): Promise<ShippingRateDto[]> {
        return this.shipmentService.getShippingRates(shipmentRequest);
    }
}