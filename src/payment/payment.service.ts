import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaymentProcessorService } from './services/payment-processor.service';
import { RefundProcessorService } from './services/refund-processor.service';
import { PaymentRequestDto } from './dto/payment-request.dto';
import { RefundRequestDto } from './dto/refund-request.dto';
import { PaymentResponseDto, RefundResponseDto, PaymentSummaryDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentProcessor: PaymentProcessorService,
    private readonly refundProcessor: RefundProcessorService,
  ) {}

  async processPayment(request: PaymentRequestDto): Promise<PaymentResponseDto> {
    this.logger.log(`Processing payment for order ${request.orderId}`);
    return this.paymentProcessor.processPayment(request);
  }

  async verifyPayment(paymentId: string): Promise<PaymentResponseDto> {
    this.logger.log(`Verifying payment ${paymentId}`);
    return this.paymentProcessor.verifyPayment(paymentId);
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponseDto> {
    this.logger.log(`Getting payment status for ${paymentId}`);
    return this.paymentProcessor.getPaymentStatus(paymentId);
  }

  async getPaymentsByOrder(orderId: string): Promise<PaymentResponseDto[]> {
    this.logger.log(`Getting payments for order ${orderId}`);
    return this.paymentProcessor.getPaymentsByOrder(orderId);
  }

  async processRefund(request: RefundRequestDto): Promise<RefundResponseDto> {
    this.logger.log(`Processing refund for payment ${request.paymentId}`);
    return this.refundProcessor.processRefund(request);
  }

  async getRefundStatus(refundId: string): Promise<RefundResponseDto> {
    this.logger.log(`Getting refund status for ${refundId}`);
    return this.refundProcessor.getRefundStatus(refundId);
  }

  async getRefundsByOrder(orderId: string): Promise<RefundResponseDto[]> {
    this.logger.log(`Getting refunds for order ${orderId}`);
    return this.refundProcessor.getRefundsByOrder(orderId);
  }

  async getRefundsByPayment(paymentId: string): Promise<RefundResponseDto[]> {
    this.logger.log(`Getting refunds for payment ${paymentId}`);
    return this.refundProcessor.getRefundsByPayment(paymentId);
  }

  async getPaymentSummary(orderId: string): Promise<PaymentSummaryDto> {
    this.logger.log(`Getting payment summary for order ${orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const payments = await this.prisma.payment.findMany({
      where: { orderId: BigInt(orderId) },
    });

    const refunds = await this.prisma.refund.findMany({
      where: { orderId: BigInt(orderId) },
    });

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);
    const totalRefunds = refunds.length;
    const totalRefundedAmount = refunds.reduce((sum, refund) => sum + refund.amount.toNumber(), 0);
    const netAmount = totalAmount - totalRefundedAmount;

    const statusSummary = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPayments,
      totalAmount,
      totalRefunds,
      totalRefundedAmount,
      netAmount,
      statusSummary,
    };
  }
}