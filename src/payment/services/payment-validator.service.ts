import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentRequestDto } from '../dto/payment-request.dto';
import { RefundRequestDto } from '../dto/refund-request.dto';

@Injectable()
export class PaymentValidatorService {
  validatePaymentRequest(request: PaymentRequestDto): void {
    const validation = request.validate();
    if (!validation.isValid) {
      throw new BadRequestException(`Payment validation failed: ${validation.errors.join(', ')}`);
    }

    // Additional business logic validation
    this.validatePaymentAmount(request.amount);
    this.validateCurrencySupport(request.currency, request.paymentGateway);
    this.validatePaymentMethodSupport(request.paymentMethod, request.paymentGateway);
  }

  validateRefundRequest(request: RefundRequestDto): void {
    const validation = request.validate();
    if (!validation.isValid) {
      throw new BadRequestException(`Refund validation failed: ${validation.errors.join(', ')}`);
    }

    // Additional business logic validation
    this.validateRefundAmount(request.amount);
    this.validateRefundReason(request.reason);
  }

  private validatePaymentAmount(amount: number): void {
    if (amount < 1) {
      throw new BadRequestException('Minimum payment amount is ₹1');
    }

    if (amount > 1000000) {
      throw new BadRequestException('Maximum payment amount is ₹10,00,000');
    }
  }

  private validateRefundAmount(amount: number): void {
    if (amount < 0.01) {
      throw new BadRequestException('Minimum refund amount is ₹0.01');
    }

    if (amount > 1000000) {
      throw new BadRequestException('Maximum refund amount is ₹10,00,000');
    }
  }

  private validateCurrencySupport(currency: string, gateway: string): void {
    const supportedCurrencies: Record<string, string[]> = {
      razorpay: ['INR'],
      stripe: ['INR', 'USD', 'EUR', 'GBP'],
      paypal: ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    };

    const supported = supportedCurrencies[gateway] || [];
    if (!supported.includes(currency)) {
      throw new BadRequestException(`Currency ${currency} is not supported by ${gateway} gateway`);
    }
  }

  private validatePaymentMethodSupport(method: string, gateway: string): void {
    const supportedMethods: Record<string, string[]> = {
      razorpay: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod'],
      stripe: ['credit_card', 'debit_card'],
      paypal: ['credit_card', 'debit_card', 'paypal'],
    };

    const supported = supportedMethods[gateway] || [];
    if (!supported.includes(method)) {
      throw new BadRequestException(`Payment method ${method} is not supported by ${gateway} gateway`);
    }
  }

  private validateRefundReason(reason: string): void {
    const validReasons = [
      'customer_request',
      'product_defect',
      'wrong_item',
      'not_as_described',
      'damaged_in_shipping',
      'duplicate_payment',
      'fraud',
      'other',
    ];

    if (!validReasons.includes(reason)) {
      throw new BadRequestException(`Invalid refund reason: ${reason}`);
    }
  }
}
