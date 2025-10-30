import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaymentRequestDto } from '../dto/payment-request.dto';
import { PaymentResponseDto, PaymentStatus } from '../dto/payment-response.dto';
import { PaymentGateway } from '../gateways/payment-gateway.interface';
import { RazorpayGateway } from '../gateways/razorpay.gateway';
import { StripeGateway } from '../gateways/stripe.gateway';
import { PayPalGateway } from '../gateways/paypal.gateway';

@Injectable()
export class PaymentProcessorService {
    private readonly logger = new Logger(PaymentProcessorService.name);
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

    async processPayment(request: PaymentRequestDto): Promise<PaymentResponseDto> {
        this.logger.log(`Processing payment for order ${request.orderId}`);

        // Validate request
        const validation = request.validate();
        if (!validation.isValid) {
            throw new BadRequestException(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Check if order exists
        const order = await this.prisma.order.findUnique({
            where: { id: BigInt(request.orderId) },
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${request.orderId} not found`);
        }

        // Get payment gateway
        const gateway = this.gateways.get(request.paymentGateway);
        if (!gateway) {
            throw new BadRequestException(`Unsupported payment gateway: ${request.paymentGateway}`);
        }

        try {
            // Process payment through gateway
            const gatewayResponse = await gateway.processPayment({
                orderId: request.orderId,
                amount: request.amount,
                currency: request.currency,
                customerId: request.customerId,
                customerEmail: request.customerEmail,
                customerPhone: request.customerPhone,
                description: request.description,
                metadata: request.metadata,
            });

            if (!gatewayResponse.success) {
                throw new BadRequestException(gatewayResponse.error || 'Payment processing failed');
            }

            // Create payment record
            const payment = await this.prisma.payment.create({
                data: {
                    orderId: BigInt(request.orderId),
                    paymentMethod: request.paymentMethod,
                    paymentGateway: request.paymentGateway,
                    transactionId: gatewayResponse.transactionId,
                    amount: request.amount,
                    currency: request.currency,
                    status: 'PENDING',
                    gatewayResponse: gatewayResponse.gatewayResponse as any,
                },
            });

            this.logger.log(`Payment created with ID ${payment.id}`);

            return this.mapPaymentToResponseDto(payment);
        } catch (error) {
            this.logger.error('Payment processing failed:', error);
            throw error;
        }
    }

    async verifyPayment(paymentId: string): Promise<PaymentResponseDto> {
        this.logger.log(`Verifying payment ${paymentId}`);

        const payment = await this.prisma.payment.findUnique({
            where: { id: BigInt(paymentId) },
        });

        if (!payment) {
            throw new NotFoundException(`Payment with ID ${paymentId} not found`);
        }

        const gateway = this.gateways.get(payment.paymentGateway);
        if (!gateway || !payment.transactionId) {
            throw new BadRequestException('Invalid payment gateway or transaction ID');
        }

        try {
            // Verify payment with gateway
            const gatewayResponse = await gateway.verifyPayment(payment.transactionId);

            if (!gatewayResponse.success) {
                throw new BadRequestException(gatewayResponse.error || 'Payment verification failed');
            }

            // Update payment status
            const updatedPayment = await this.prisma.payment.update({
                where: { id: BigInt(paymentId) },
                data: {
                    status: 'COMPLETED',
                    processedAt: new Date(),
                    gatewayResponse: gatewayResponse.gatewayResponse as any,
                },
            });

            // Update order payment status
            await this.prisma.order.update({
                where: { id: payment.orderId },
                data: { paymentStatus: 'COMPLETED' },
            });

            this.logger.log(`Payment ${paymentId} verified and completed`);

            return this.mapPaymentToResponseDto(updatedPayment);
        } catch (error) {
            this.logger.error('Payment verification failed:', error);
            throw error;
        }
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentResponseDto> {
        this.logger.log(`Getting payment status for ${paymentId}`);

        const payment = await this.prisma.payment.findUnique({
            where: { id: BigInt(paymentId) },
        });

        if (!payment) {
            throw new NotFoundException(`Payment with ID ${paymentId} not found`);
        }

        return this.mapPaymentToResponseDto(payment);
    }

    async getPaymentsByOrder(orderId: string): Promise<PaymentResponseDto[]> {
        this.logger.log(`Getting payments for order ${orderId}`);

        const payments = await this.prisma.payment.findMany({
            where: { orderId: BigInt(orderId) },
            orderBy: { createdAt: 'desc' },
        });

        return payments.map(payment => this.mapPaymentToResponseDto(payment));
    }

    private mapPaymentToResponseDto(payment: any): PaymentResponseDto {
        return {
            id: payment.id.toString(),
            orderId: payment.orderId.toString(),
            paymentMethod: payment.paymentMethod,
            paymentGateway: payment.paymentGateway,
            transactionId: payment.transactionId,
            amount: payment.amount.toNumber(),
            currency: payment.currency,
            status: payment.status,
            gatewayResponse: payment.gatewayResponse,
            processedAt: payment.processedAt,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
        };
    }
}
