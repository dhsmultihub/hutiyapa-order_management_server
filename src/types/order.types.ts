import { Decimal } from '@prisma/client/runtime/library';

// Base types
export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';

export type PaymentStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'REFUNDED';

export type FulfillmentStatus =
    | 'UNFULFILLED'
    | 'FULFILLED'
    | 'PARTIALLY_FULFILLED'
    | 'CANCELLED';

export type ShipmentStatus =
    | 'PENDING'
    | 'SHIPPED'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'FAILED'
    | 'RETURNED';

export type ReturnStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'PROCESSED'
    | 'CANCELLED';

export type RefundStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';

// Address types
export interface Address {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
}

// Order Item types
export interface OrderItemData {
    productId: string;
    variantId?: string;
    sku: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate?: number;
    metadata?: Record<string, any>;
}

export interface OrderItem extends OrderItemData {
    id: string;
    orderId: string;
    createdAt: Date;
}

// Payment types
export interface PaymentData {
    paymentMethod: string;
    paymentGateway: string;
    transactionId?: string;
    amount: number;
    currency?: string;
    gatewayResponse?: Record<string, any>;
}

export interface Payment extends PaymentData {
    id: string;
    orderId: string;
    status: PaymentStatus;
    processedAt?: Date;
    createdAt: Date;
}

// Shipment types
export interface ShipmentData {
    trackingNumber?: string;
    carrier: string;
    serviceType?: string;
    status: ShipmentStatus;
    shippedAt?: Date;
    deliveredAt?: Date;
    estimatedDelivery?: Date;
    trackingUrl?: string;
}

export interface Shipment extends ShipmentData {
    id: string;
    orderId: string;
    createdAt: Date;
}

// Return types
export interface ReturnData {
    returnNumber: string;
    reason: string;
    status: ReturnStatus;
    requestedAt: Date;
    approvedAt?: Date;
    processedAt?: Date;
    refundAmount?: number;
    notes?: string;
}

export interface Return extends ReturnData {
    id: string;
    orderId: string;
}

// Refund types
export interface RefundData {
    paymentId: string;
    amount: number;
    reason: string;
    status: RefundStatus;
    processedAt?: Date;
}

export interface Refund extends RefundData {
    id: string;
    orderId: string;
    createdAt: Date;
}

// Main Order types
export interface OrderData {
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    totalAmount: number;
    subtotal: number;
    taxAmount?: number;
    shippingAmount?: number;
    discountAmount?: number;
    currency?: string;
    shippingAddress: Address;
    billingAddress: Address;
    notes?: string;
    orderItems: OrderItemData[];
}

export interface Order extends OrderData {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    orderItems: OrderItem[];
    payments?: Payment[];
    shipments?: Shipment[];
    returns?: Return[];
    refunds?: Refund[];
}

// Create Order DTO
export interface CreateOrderDto {
    userId: string;
    shippingAddress: Address;
    billingAddress: Address;
    notes?: string;
    orderItems: OrderItemData[];
    paymentMethod: string;
    paymentGateway: string;
    currency?: string;
}

// Update Order DTO
export interface UpdateOrderDto {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    fulfillmentStatus?: FulfillmentStatus;
    notes?: string;
    shippingAddress?: Address;
    billingAddress?: Address;
}

// Order Response DTO
export interface OrderResponseDto {
    id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    totalAmount: number;
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    currency: string;
    shippingAddress: Address;
    billingAddress: Address;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    orderItems: OrderItem[];
    payments?: Payment[];
    shipments?: Shipment[];
    returns?: Return[];
    refunds?: Refund[];
}

// Order Query DTO
export interface OrderQueryDto {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    fulfillmentStatus?: FulfillmentStatus;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Order Statistics DTO
export interface OrderStatisticsDto {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
    ordersByPaymentStatus: Record<PaymentStatus, number>;
    ordersByFulfillmentStatus: Record<FulfillmentStatus, number>;
    recentOrders: OrderResponseDto[];
    topProducts: Array<{
        productId: string;
        name: string;
        quantity: number;
        revenue: number;
    }>;
}

// Order Analytics DTO
export interface OrderAnalyticsDto {
    period: 'day' | 'week' | 'month' | 'year';
    startDate: Date;
    endDate: Date;
    metrics: {
        orderCount: number;
        revenue: number;
        averageOrderValue: number;
        conversionRate: number;
        refundRate: number;
    };
    trends: Array<{
        date: string;
        orders: number;
        revenue: number;
    }>;
    topCustomers: Array<{
        userId: string;
        orderCount: number;
        totalSpent: number;
    }>;
    topProducts: Array<{
        productId: string;
        name: string;
        quantity: number;
        revenue: number;
    }>;
}

// Order Status Transition types
export interface OrderStatusTransition {
    from: OrderStatus;
    to: OrderStatus;
    allowed: boolean;
    conditions?: string[];
}

// Order Validation types
export interface OrderValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Order Processing types
export interface OrderProcessingContext {
    orderId: string;
    userId: string;
    orderNumber: string;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    paymentGateway: string;
    shippingAddress: Address;
    billingAddress: Address;
    orderItems: OrderItemData[];
}

// Order Event types
export interface OrderEvent {
    type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED' | 'PAYMENT_PROCESSED' | 'SHIPMENT_CREATED' | 'ORDER_DELIVERED';
    orderId: string;
    orderNumber: string;
    userId: string;
    timestamp: Date;
    data: Record<string, any>;
}

// Order Notification types
export interface OrderNotification {
    type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    recipient: string;
    template: string;
    data: Record<string, any>;
    scheduledAt?: Date;
}

// Order Search types
export interface OrderSearchCriteria {
    query?: string;
    filters: {
        status?: OrderStatus[];
        paymentStatus?: PaymentStatus[];
        fulfillmentStatus?: FulfillmentStatus[];
        userId?: string;
        dateRange?: {
            start: Date;
            end: Date;
        };
        amountRange?: {
            min: number;
            max: number;
        };
    };
    pagination: {
        page: number;
        limit: number;
    };
    sorting: {
        field: string;
        order: 'asc' | 'desc';
    };
}

// Order Export types
export interface OrderExportOptions {
    format: 'CSV' | 'EXCEL' | 'PDF';
    fields: string[];
    filters: OrderSearchCriteria['filters'];
    dateRange: {
        start: Date;
        end: Date;
    };
}

// Order Import types
export interface OrderImportResult {
    success: boolean;
    imported: number;
    failed: number;
    errors: Array<{
        row: number;
        error: string;
    }>;
}

// Order Audit types
export interface OrderAuditLog {
    id: string;
    orderId: string;
    action: string;
    performedBy: string;
    performedAt: Date;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
}
