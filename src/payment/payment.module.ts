import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentProcessorService } from './services/payment-processor.service';
import { RefundProcessorService } from './services/refund-processor.service';
import { PaymentValidatorService } from './services/payment-validator.service';
import { RazorpayGateway } from './gateways/razorpay.gateway';
import { StripeGateway } from './gateways/stripe.gateway';
import { PayPalGateway } from './gateways/paypal.gateway';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentProcessorService,
    RefundProcessorService,
    PaymentValidatorService,
    RazorpayGateway,
    StripeGateway,
    PayPalGateway,
  ],
  exports: [PaymentService, PaymentProcessorService, RefundProcessorService],
})
export class PaymentModule {}