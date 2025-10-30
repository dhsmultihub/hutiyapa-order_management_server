export interface PaymentGatewayResponse {
    success: boolean;
    transactionId?: string;
    gatewayResponse?: any;
    error?: string;
    redirectUrl?: string;
}

export interface PaymentRequest {
    orderId: string;
    amount: number;
    currency: string;
    customerId: string;
    customerEmail: string;
    customerPhone?: string;
    description?: string;
    metadata?: Record<string, any>;
}

export interface RefundRequest {
    paymentId: string;
    amount: number;
    reason: string;
    metadata?: Record<string, any>;
}

export interface PaymentGateway {
    processPayment(request: PaymentRequest): Promise<PaymentGatewayResponse>;
    verifyPayment(transactionId: string): Promise<PaymentGatewayResponse>;
    processRefund(request: RefundRequest): Promise<PaymentGatewayResponse>;
    getPaymentStatus(transactionId: string): Promise<PaymentGatewayResponse>;
}
