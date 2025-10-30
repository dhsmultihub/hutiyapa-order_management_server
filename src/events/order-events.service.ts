import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderWebSocketGateway } from '../websocket/websocket.gateway';
import { NotificationService } from '../notification/notification.service';
import { NotificationType, NotificationPriority } from '../notification/dto/notification.dto';

export interface OrderEventData {
  orderId: string;
  orderNumber: string;
  userId: string;
  oldStatus?: string;
  newStatus?: string;
  amount?: number;
  paymentMethod?: string;
  transactionId?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
  deliveredAt?: Date;
  deliveryAddress?: string;
  reason?: string;
  refundAmount?: number;
  [key: string]: any;
}

@Injectable()
export class OrderEventsService {
  private readonly logger = new Logger(OrderEventsService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly websocketGateway: OrderWebSocketGateway,
    private readonly notificationService: NotificationService,
  ) {}

  // Order lifecycle events
  async emitOrderCreated(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting order created event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('order.created', data);

    // Send WebSocket update
    this.websocketGateway.emitOrderUpdate(data.orderId, {
      type: 'ORDER_CREATED',
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      status: data.newStatus,
      amount: data.amount,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.ORDER_CREATED,
      data,
      NotificationPriority.MEDIUM,
    );
  }

  async emitOrderStatusChanged(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting order status changed event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('order.status.changed', data);

    // Send WebSocket update
    this.websocketGateway.emitOrderStatusChange(
      data.orderId,
      data.oldStatus!,
      data.newStatus!,
      data.userId,
    );

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.ORDER_STATUS_CHANGED,
      data,
      this.getPriorityForStatusChange(data.newStatus!),
    );
  }

  async emitOrderCancelled(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting order cancelled event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('order.cancelled', data);

    // Send WebSocket update
    this.websocketGateway.emitOrderUpdate(data.orderId, {
      type: 'ORDER_CANCELLED',
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      reason: data.reason,
      refundAmount: data.refundAmount,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.ORDER_CANCELLED,
      data,
      NotificationPriority.HIGH,
    );
  }

  // Payment events
  async emitPaymentReceived(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting payment received event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('payment.received', data);

    // Send WebSocket update
    this.websocketGateway.emitPaymentUpdate(data.orderId, {
      type: 'PAYMENT_RECEIVED',
      orderId: data.orderId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.PAYMENT_RECEIVED,
      data,
      NotificationPriority.MEDIUM,
    );
  }

  async emitPaymentFailed(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting payment failed event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('payment.failed', data);

    // Send WebSocket update
    this.websocketGateway.emitPaymentUpdate(data.orderId, {
      type: 'PAYMENT_FAILED',
      orderId: data.orderId,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.PAYMENT_FAILED,
      data,
      NotificationPriority.HIGH,
    );
  }

  async emitRefundProcessed(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting refund processed event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('refund.processed', data);

    // Send WebSocket update
    this.websocketGateway.emitPaymentUpdate(data.orderId, {
      type: 'REFUND_PROCESSED',
      orderId: data.orderId,
      refundAmount: data.refundAmount,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.REFUND_PROCESSED,
      data,
      NotificationPriority.MEDIUM,
    );
  }

  // Shipment events
  async emitShipmentCreated(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting shipment created event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('shipment.created', data);

    // Send WebSocket update
    this.websocketGateway.emitShipmentUpdate(data.orderId, {
      type: 'SHIPMENT_CREATED',
      orderId: data.orderId,
      trackingNumber: data.trackingNumber,
      carrier: data.carrier,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.SHIPMENT_CREATED,
      data,
      NotificationPriority.MEDIUM,
    );
  }

  async emitShipmentInTransit(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting shipment in transit event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('shipment.in_transit', data);

    // Send WebSocket update
    this.websocketGateway.emitShipmentUpdate(data.orderId, {
      type: 'SHIPMENT_IN_TRANSIT',
      orderId: data.orderId,
      trackingNumber: data.trackingNumber,
      carrier: data.carrier,
      estimatedDelivery: data.estimatedDelivery,
      trackingUrl: data.trackingUrl,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.SHIPMENT_IN_TRANSIT,
      data,
      NotificationPriority.MEDIUM,
    );
  }

  async emitShipmentDelivered(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting shipment delivered event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('shipment.delivered', data);

    // Send WebSocket update
    this.websocketGateway.emitShipmentUpdate(data.orderId, {
      type: 'SHIPMENT_DELIVERED',
      orderId: data.orderId,
      deliveredAt: data.deliveredAt,
      deliveryAddress: data.deliveryAddress,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.SHIPMENT_DELIVERED,
      data,
      NotificationPriority.MEDIUM,
    );
  }

  // Support events
  async emitSupportTicketCreated(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting support ticket created event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('support.ticket.created', data);

    // Send WebSocket update
    this.websocketGateway.emitNotification(data.userId, {
      type: 'SUPPORT_TICKET_CREATED',
      ticketId: data.ticketId,
      ticketNumber: data.ticketNumber,
      subject: data.subject,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.SUPPORT_TICKET_CREATED,
      data,
      NotificationPriority.MEDIUM,
    );
  }

  async emitSupportTicketUpdated(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting support ticket updated event for order ${data.orderId}`);

    // Emit internal event
    this.eventEmitter.emit('support.ticket.updated', data);

    // Send WebSocket update
    this.websocketGateway.emitNotification(data.userId, {
      type: 'SUPPORT_TICKET_UPDATED',
      ticketId: data.ticketId,
      ticketNumber: data.ticketNumber,
      status: data.newStatus,
      timestamp: new Date().toISOString(),
    });

    // Send notification
    await this.notificationService.sendOrderNotification(
      data.userId,
      NotificationType.SUPPORT_TICKET_UPDATED,
      data,
      NotificationPriority.MEDIUM,
    );
  }

  // System events
  async emitSystemAlert(data: OrderEventData): Promise<void> {
    this.logger.log(`Emitting system alert: ${data.message}`);

    // Emit internal event
    this.eventEmitter.emit('system.alert', data);

    // Send WebSocket broadcast
    this.websocketGateway.emitSystemAlert({
      type: 'SYSTEM_ALERT',
      message: data.message,
      severity: data.severity || 'HIGH',
      timestamp: new Date().toISOString(),
    });

    // Send system notification
    await this.notificationService.sendSystemNotification(
      NotificationType.SYSTEM_ALERT,
      data.title || 'System Alert',
      data.message,
      data,
      NotificationPriority.URGENT,
    );
  }

  // Helper methods
  private getPriorityForStatusChange(status: string): NotificationPriority {
    switch (status) {
      case 'CANCELLED':
        return NotificationPriority.HIGH;
      case 'DELIVERED':
      case 'COMPLETED':
        return NotificationPriority.MEDIUM;
      case 'PENDING':
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'SHIPPED':
        return NotificationPriority.LOW;
      default:
        return NotificationPriority.MEDIUM;
    }
  }

  // Event listeners for internal processing
  async onOrderCreated(data: OrderEventData): Promise<void> {
    this.logger.log(`Processing order created event for order ${data.orderId}`);
    // Add any additional processing logic here
  }

  async onOrderStatusChanged(data: OrderEventData): Promise<void> {
    this.logger.log(`Processing order status changed event for order ${data.orderId}`);
    // Add any additional processing logic here
  }

  async onPaymentReceived(data: OrderEventData): Promise<void> {
    this.logger.log(`Processing payment received event for order ${data.orderId}`);
    // Add any additional processing logic here
  }

  async onShipmentDelivered(data: OrderEventData): Promise<void> {
    this.logger.log(`Processing shipment delivered event for order ${data.orderId}`);
    // Add any additional processing logic here
  }
}
