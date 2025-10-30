import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RefundRequestDto } from '../dto/refund-request.dto';
import { RefundResponseDto, PaymentStatus } from '../dto/payment-response.dto';
import { PaymentGateway } from '../gateways/payment-gateway.interface';
import { RazorpayGateway } from '../gateways/razorpay.gateway';
import { StripeGateway } from '../gateways/stripe.gateway';
import { PayPalGateway } from '../gateways/paypal.gateway';

@Injectable()
export class RefundProcessorService {
  private readonly logger = new Logger(RefundProcessorService.name);
  private readonly gateways: Map<string, PaymentGateway>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayGateway: RazorpayGateway,
    private readonly stripeGateway: StripeGateway,
    private readonly paypalGateway: PayPalGateway,
  ) {
    this.gateways = new Map<string, PaymentGateway>([
      ['razorpay', this.razorpayGateway],
      ['stripe', this.stripeGateway],
      ['paypal', this.paypalGateway],
    ]);
  }

  async processRefund(request: RefundRequestDto): Promise<RefundResponseDto> {
    this.logger.log(`Processing refund for payment ${request.paymentId}`);

    // Validate request
    const validation = request.validate();
    if (!validation.isValid) {
      throw new BadRequestException(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Get payment details
    const payment = await this.prisma.payment.findUnique({
      where: { id: BigInt(request.paymentId) },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${request.paymentId} not found`);
    }

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only refund completed payments');
    }

    // Check if refund amount is valid
    const existingRefunds = await this.prisma.refund.findMany({
      where: { paymentId: BigInt(request.paymentId) },
    });

    const totalRefunded = existingRefunds.reduce((sum, refund) => sum + refund.amount.toNumber(), 0);
    const availableAmount = payment.amount.toNumber() - totalRefunded;

    if (request.amount > availableAmount) {
      throw new BadRequestException(`Refund amount cannot exceed available amount: ${availableAmount}`);
    }

    // Get payment gateway
    const gateway = this.gateways.get(payment.paymentGateway);
    if (!gateway || !payment.transactionId) {
      throw new BadRequestException('Invalid payment gateway or transaction ID');
    }

    try {
      // Process refund through gateway
      const gatewayResponse = await gateway.processRefund({
        paymentId: payment.transactionId,
        amount: request.amount,
        reason: request.reason,
        metadata: request.metadata,
      });

      if (!gatewayResponse.success) {
        throw new BadRequestException(gatewayResponse.error || 'Refund processing failed');
      }

      // Create refund record
      const refund = await this.prisma.refund.create({
        data: {
          orderId: payment.orderId,
          paymentId: BigInt(request.paymentId),
          amount: request.amount,
          reason: request.reason,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      // Update payment status
      const remainingAmount = availableAmount - request.amount;
      const newPaymentStatus = remainingAmount === 0 ? 'REFUNDED' : 'COMPLETED'; // Use valid status

      await this.prisma.payment.update({
        where: { id: BigInt(request.paymentId) },
        data: { status: newPaymentStatus },
      });

      // Update order payment status
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: newPaymentStatus },
      });

      this.logger.log(`Refund created with ID ${refund.id}`);

      return this.mapRefundToResponseDto(refund);
    } catch (error) {
      this.logger.error('Refund processing failed:', error);
      throw error;
    }
  }

  async getRefundStatus(refundId: string): Promise<RefundResponseDto> {
    this.logger.log(`Getting refund status for ${refundId}`);

    const refund = await this.prisma.refund.findUnique({
      where: { id: BigInt(refundId) },
    });

    if (!refund) {
      throw new NotFoundException(`Refund with ID ${refundId} not found`);
    }

    return this.mapRefundToResponseDto(refund);
  }

  async getRefundsByOrder(orderId: string): Promise<RefundResponseDto[]> {
    this.logger.log(`Getting refunds for order ${orderId}`);

    const refunds = await this.prisma.refund.findMany({
      where: { orderId: BigInt(orderId) },
      orderBy: { createdAt: 'desc' },
    });

    return refunds.map(refund => this.mapRefundToResponseDto(refund));
  }

  async getRefundsByPayment(paymentId: string): Promise<RefundResponseDto[]> {
    this.logger.log(`Getting refunds for payment ${paymentId}`);

    const refunds = await this.prisma.refund.findMany({
      where: { paymentId: BigInt(paymentId) },
      orderBy: { createdAt: 'desc' },
    });

    return refunds.map(refund => this.mapRefundToResponseDto(refund));
  }

  private mapRefundToResponseDto(refund: any): RefundResponseDto {
    return {
      id: refund.id.toString(),
      orderId: refund.orderId.toString(),
      paymentId: refund.paymentId.toString(),
      amount: refund.amount.toNumber(),
      reason: refund.reason,
      status: refund.status,
      gatewayTransactionId: undefined, // Field not in schema
      gatewayResponse: undefined, // Field not in schema
      notes: undefined, // Field not in schema
      processedAt: refund.processedAt,
      createdAt: refund.createdAt,
    };
  }
}
