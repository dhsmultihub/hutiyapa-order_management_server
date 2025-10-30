import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from './update-order.dto';

export class OrderItemResponseDto {
  @ApiProperty({ description: 'Order item ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Order ID', example: '1' })
  orderId: string;

  @ApiProperty({ description: 'Product ID', example: 'PROD-001' })
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID', example: 'VAR-001-RED-M' })
  variantId?: string;

  @ApiProperty({ description: 'Product SKU', example: 'TSHIRT-RED-M' })
  sku: string;

  @ApiProperty({ description: 'Product name', example: 'Premium Cotton T-Shirt' })
  name: string;

  @ApiPropertyOptional({ description: 'Product description', example: '100% cotton, comfortable fit' })
  description?: string;

  @ApiProperty({ description: 'Quantity', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: 999.00 })
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item', example: 1998.00 })
  totalPrice: number;

  @ApiProperty({ description: 'Tax rate percentage', example: 18.0 })
  taxRate: number;

  @ApiPropertyOptional({ description: 'Additional metadata', example: { color: 'Red', size: 'M' } })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Created at', example: '2024-01-14T15:30:00Z' })
  createdAt: Date;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Order ID', example: '1' })
  orderId: string;

  @ApiProperty({ description: 'Payment method', example: 'credit_card' })
  paymentMethod: string;

  @ApiProperty({ description: 'Payment gateway', example: 'razorpay' })
  paymentGateway: string;

  @ApiPropertyOptional({ description: 'Transaction ID', example: 'txn_1234567890' })
  transactionId?: string;

  @ApiProperty({ description: 'Payment amount', example: 2999.00 })
  amount: number;

  @ApiProperty({ description: 'Currency', example: 'INR' })
  currency: string;

  @ApiProperty({ description: 'Payment status', example: 'COMPLETED', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Gateway response', example: { payment_id: 'pay_1234567890' } })
  gatewayResponse?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Processed at', example: '2024-01-14T15:30:00Z' })
  processedAt?: Date;

  @ApiProperty({ description: 'Created at', example: '2024-01-14T15:30:00Z' })
  createdAt: Date;
}

export class ShipmentResponseDto {
  @ApiProperty({ description: 'Shipment ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Order ID', example: '1' })
  orderId: string;

  @ApiPropertyOptional({ description: 'Tracking number', example: 'BD1234567890' })
  trackingNumber?: string;

  @ApiProperty({ description: 'Carrier', example: 'Blue Dart' })
  carrier: string;

  @ApiPropertyOptional({ description: 'Service type', example: 'Express' })
  serviceType?: string;

  @ApiProperty({ description: 'Shipment status', example: 'DELIVERED' })
  status: string;

  @ApiPropertyOptional({ description: 'Shipped at', example: '2024-01-15T10:30:00Z' })
  shippedAt?: Date;

  @ApiPropertyOptional({ description: 'Delivered at', example: '2024-01-17T14:20:00Z' })
  deliveredAt?: Date;

  @ApiPropertyOptional({ description: 'Estimated delivery', example: '2024-01-18T18:00:00Z' })
  estimatedDelivery?: Date;

  @ApiPropertyOptional({ description: 'Tracking URL', example: 'https://www.bluedart.com/track/BD1234567890' })
  trackingUrl?: string;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: Date;
}

export class ReturnResponseDto {
  @ApiProperty({ description: 'Return ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Order ID', example: '1' })
  orderId: string;

  @ApiProperty({ description: 'Return number', example: 'RET-2024-001' })
  returnNumber: string;

  @ApiProperty({ description: 'Return reason', example: 'Product defect' })
  reason: string;

  @ApiProperty({ description: 'Return status', example: 'APPROVED' })
  status: string;

  @ApiProperty({ description: 'Requested at', example: '2024-01-20T10:00:00Z' })
  requestedAt: Date;

  @ApiPropertyOptional({ description: 'Approved at', example: '2024-01-21T14:30:00Z' })
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Processed at', example: '2024-01-22T09:00:00Z' })
  processedAt?: Date;

  @ApiPropertyOptional({ description: 'Refund amount', example: 999.00 })
  refundAmount?: number;

  @ApiPropertyOptional({ description: 'Return notes', example: 'Customer reported stitching issue' })
  notes?: string;
}

export class RefundResponseDto {
  @ApiProperty({ description: 'Refund ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Order ID', example: '1' })
  orderId: string;

  @ApiProperty({ description: 'Payment ID', example: '1' })
  paymentId: string;

  @ApiProperty({ description: 'Refund amount', example: 999.00 })
  amount: number;

  @ApiProperty({ description: 'Refund reason', example: 'Product defect' })
  reason: string;

  @ApiProperty({ description: 'Refund status', example: 'COMPLETED' })
  status: string;

  @ApiPropertyOptional({ description: 'Processed at', example: '2024-01-22T09:00:00Z' })
  processedAt?: Date;

  @ApiProperty({ description: 'Created at', example: '2024-01-22T09:00:00Z' })
  createdAt: Date;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Order number', example: 'ORD-2024-001' })
  orderNumber: string;

  @ApiProperty({ description: 'User ID', example: '1' })
  userId: string;

  @ApiProperty({ description: 'Order status', example: 'COMPLETED', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Payment status', example: 'COMPLETED', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Fulfillment status', example: 'FULFILLED', enum: FulfillmentStatus })
  fulfillmentStatus: FulfillmentStatus;

  @ApiProperty({ description: 'Total amount', example: 2999.00 })
  totalAmount: number;

  @ApiProperty({ description: 'Subtotal', example: 2499.00 })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount', example: 449.82 })
  taxAmount: number;

  @ApiProperty({ description: 'Shipping amount', example: 50.18 })
  shippingAmount: number;

  @ApiProperty({ description: 'Discount amount', example: 0 })
  discountAmount: number;

  @ApiProperty({ description: 'Currency', example: 'INR' })
  currency: string;

  @ApiProperty({ description: 'Shipping address', example: { firstName: 'John', lastName: 'Doe', address1: '123 Main Street', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' } })
  shippingAddress: Record<string, any>;

  @ApiProperty({ description: 'Billing address', example: { firstName: 'John', lastName: 'Doe', address1: '123 Main Street', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' } })
  billingAddress: Record<string, any>;

  @ApiPropertyOptional({ description: 'Order notes', example: 'Please handle with care' })
  notes?: string;

  @ApiProperty({ description: 'Created at', example: '2024-01-14T15:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2024-01-14T15:30:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Shipped at', example: '2024-01-15T10:30:00Z' })
  shippedAt?: Date;

  @ApiPropertyOptional({ description: 'Delivered at', example: '2024-01-17T14:20:00Z' })
  deliveredAt?: Date;

  @ApiPropertyOptional({ description: 'Cancelled at', example: '2024-01-22T16:45:00Z' })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Order items', type: [OrderItemResponseDto] })
  orderItems: OrderItemResponseDto[];

  @ApiPropertyOptional({ description: 'Payments', type: [PaymentResponseDto] })
  payments?: PaymentResponseDto[];

  @ApiPropertyOptional({ description: 'Shipments', type: [ShipmentResponseDto] })
  shipments?: ShipmentResponseDto[];

  @ApiPropertyOptional({ description: 'Returns', type: [ReturnResponseDto] })
  returns?: ReturnResponseDto[];

  @ApiPropertyOptional({ description: 'Refunds', type: [RefundResponseDto] })
  refunds?: RefundResponseDto[];
}
