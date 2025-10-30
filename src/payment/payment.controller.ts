import { Controller, Get, Post, Put, Param, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PaymentRequestDto } from './dto/payment-request.dto';
import { RefundRequestDto } from './dto/refund-request.dto';
import { PaymentResponseDto, RefundResponseDto, PaymentSummaryDto } from './dto/payment-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Process a new payment' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async processPayment(
    @Body() paymentRequest: PaymentRequestDto,
    @CurrentUser() user: any
  ): Promise<PaymentResponseDto> {
    return this.paymentService.processPayment(paymentRequest);
  }

  @Put(':id/verify')
  @ApiParam({ name: 'id', description: 'Payment ID', example: '1' })
  @ApiOperation({ summary: 'Verify a payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async verifyPayment(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<PaymentResponseDto> {
    return this.paymentService.verifyPayment(id);
  }

  @Get(':id')
  @Public()
  @ApiParam({ name: 'id', description: 'Payment ID', example: '1' })
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPayment(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<PaymentResponseDto> {
    return this.paymentService.getPaymentStatus(id);
  }

  @Get('order/:orderId')
  @Public()
  @ApiParam({ name: 'orderId', description: 'Order ID', example: '1' })
  @ApiOperation({ summary: 'Get payments by order ID' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully', type: [PaymentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPaymentsByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any
  ): Promise<PaymentResponseDto[]> {
    return this.paymentService.getPaymentsByOrder(orderId);
  }

  @Get('order/:orderId/summary')
  @ApiParam({ name: 'orderId', description: 'Order ID', example: '1' })
  @ApiOperation({ summary: 'Get payment summary for order' })
  @ApiResponse({ status: 200, description: 'Payment summary retrieved successfully', type: PaymentSummaryDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPaymentSummary(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any
  ): Promise<PaymentSummaryDto> {
    return this.paymentService.getPaymentSummary(orderId);
  }

  @Post('refund')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Process a refund' })
  @ApiResponse({ status: 201, description: 'Refund processed successfully', type: RefundResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid refund data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async processRefund(
    @Body() refundRequest: RefundRequestDto,
    @CurrentUser() user: any
  ): Promise<RefundResponseDto> {
    return this.paymentService.processRefund(refundRequest);
  }

  @Get('refund/:id')
  @ApiParam({ name: 'id', description: 'Refund ID', example: '1' })
  @ApiOperation({ summary: 'Get refund by ID' })
  @ApiResponse({ status: 200, description: 'Refund retrieved successfully', type: RefundResponseDto })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRefund(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<RefundResponseDto> {
    return this.paymentService.getRefundStatus(id);
  }

  @Get('refund/order/:orderId')
  @ApiParam({ name: 'orderId', description: 'Order ID', example: '1' })
  @ApiOperation({ summary: 'Get refunds by order ID' })
  @ApiResponse({ status: 200, description: 'Refunds retrieved successfully', type: [RefundResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRefundsByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any
  ): Promise<RefundResponseDto[]> {
    return this.paymentService.getRefundsByOrder(orderId);
  }

  @Get('refund/payment/:paymentId')
  @ApiParam({ name: 'paymentId', description: 'Payment ID', example: '1' })
  @ApiOperation({ summary: 'Get refunds by payment ID' })
  @ApiResponse({ status: 200, description: 'Refunds retrieved successfully', type: [RefundResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRefundsByPayment(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: any
  ): Promise<RefundResponseDto[]> {
    return this.paymentService.getRefundsByPayment(paymentId);
  }
}