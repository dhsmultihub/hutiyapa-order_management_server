import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType, NotificationPriority } from '../dto/notification.dto';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  sound?: string;
  click_action?: string;
  tag?: string;
}

interface DeviceToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  userId: string;
  isActive: boolean;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private deviceTokens: Map<string, DeviceToken[]> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async sendPushNotification(
    userId: string,
    type: NotificationType,
    data: any,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
  ): Promise<boolean> {
    try {
      const userTokens = this.deviceTokens.get(userId) || [];
      const activeTokens = userTokens.filter(token => token.isActive);

      if (activeTokens.length === 0) {
        this.logger.log(`No active device tokens found for user ${userId}`);
        return false;
      }

      const payload = this.createPushPayload(type, data, priority);
      const results = await Promise.allSettled(
        activeTokens.map(token => this.sendToDevice(token, payload))
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      this.logger.log(`Push notification sent to ${successCount}/${activeTokens.length} devices for user ${userId}`);

      return successCount > 0;
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${userId}: ${error.message}`);
      return false;
    }
  }

  private createPushPayload(
    type: NotificationType,
    data: any,
    priority: NotificationPriority,
  ): PushNotificationPayload {
    const basePayload = {
      title: data.title || this.getDefaultTitle(type),
      body: data.message || this.getDefaultMessage(type, data),
      data: {
        type,
        orderId: data.orderId,
        ...data,
      },
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      sound: 'default',
      click_action: this.getClickAction(type, data),
      tag: type,
    };

    // Adjust payload based on priority
    if (priority === NotificationPriority.URGENT) {
      basePayload.sound = 'urgent.wav';
      basePayload.badge = '/icons/urgent-badge.png';
    }

    return basePayload;
  }

  private async sendToDevice(token: DeviceToken, payload: PushNotificationPayload): Promise<boolean> {
    try {
      // Mock implementation - replace with actual push notification service (FCM, APNS, etc.)
      this.logger.log(`[MOCK PUSH] Sending to ${token.platform} device ${token.token}: ${payload.title}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Mock success/failure (90% success rate)
      return Math.random() > 0.1;
    } catch (error) {
      this.logger.error(`Failed to send push to device ${token.token}: ${error.message}`);
      return false;
    }
  }

  private getDefaultTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.ORDER_CREATED:
        return 'Order Confirmed';
      case NotificationType.ORDER_STATUS_CHANGED:
        return 'Order Status Updated';
      case NotificationType.PAYMENT_RECEIVED:
        return 'Payment Received';
      case NotificationType.SHIPMENT_IN_TRANSIT:
        return 'Order Shipped';
      case NotificationType.SHIPMENT_DELIVERED:
        return 'Order Delivered';
      case NotificationType.ORDER_CANCELLED:
        return 'Order Cancelled';
      case NotificationType.PAYMENT_FAILED:
        return 'Payment Failed';
      case NotificationType.REFUND_PROCESSED:
        return 'Refund Processed';
      case NotificationType.SUPPORT_TICKET_CREATED:
        return 'Support Ticket Created';
      case NotificationType.SUPPORT_TICKET_UPDATED:
        return 'Support Ticket Updated';
      case NotificationType.SYSTEM_ALERT:
        return 'System Alert';
      default:
        return 'Notification';
    }
  }

  private getDefaultMessage(type: NotificationType, data: any): string {
    switch (type) {
      case NotificationType.ORDER_CREATED:
        return `Your order #${data.orderNumber} has been confirmed`;
      case NotificationType.ORDER_STATUS_CHANGED:
        return `Order #${data.orderNumber} status changed to ${data.newStatus}`;
      case NotificationType.PAYMENT_RECEIVED:
        return `Payment received for order #${data.orderNumber}`;
      case NotificationType.SHIPMENT_IN_TRANSIT:
        return `Your order #${data.orderNumber} is on the way!`;
      case NotificationType.SHIPMENT_DELIVERED:
        return `Order #${data.orderNumber} has been delivered`;
      case NotificationType.ORDER_CANCELLED:
        return `Order #${data.orderNumber} has been cancelled`;
      case NotificationType.PAYMENT_FAILED:
        return `Payment failed for order #${data.orderNumber}`;
      case NotificationType.REFUND_PROCESSED:
        return `Refund processed for order #${data.orderNumber}`;
      case NotificationType.SUPPORT_TICKET_CREATED:
        return `Support ticket #${data.ticketNumber} has been created`;
      case NotificationType.SUPPORT_TICKET_UPDATED:
        return `Update on support ticket #${data.ticketNumber}`;
      case NotificationType.SYSTEM_ALERT:
        return data.message || 'System alert notification';
      default:
        return data.message || 'You have a new notification';
    }
  }

  private getClickAction(type: NotificationType, data: any): string {
    const baseUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    
    switch (type) {
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_STATUS_CHANGED:
      case NotificationType.ORDER_CANCELLED:
        return `${baseUrl}/orders/${data.orderId}`;
      case NotificationType.SHIPMENT_IN_TRANSIT:
      case NotificationType.SHIPMENT_DELIVERED:
        return `${baseUrl}/orders/${data.orderId}/tracking`;
      case NotificationType.SUPPORT_TICKET_CREATED:
      case NotificationType.SUPPORT_TICKET_UPDATED:
        return `${baseUrl}/support/tickets/${data.ticketId}`;
      case NotificationType.PAYMENT_RECEIVED:
      case NotificationType.PAYMENT_FAILED:
      case NotificationType.REFUND_PROCESSED:
        return `${baseUrl}/orders/${data.orderId}/payment`;
      default:
        return `${baseUrl}/notifications`;
    }
  }

  // Device token management
  async registerDeviceToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<boolean> {
    try {
      if (!this.deviceTokens.has(userId)) {
        this.deviceTokens.set(userId, []);
      }

      const userTokens = this.deviceTokens.get(userId)!;
      
      // Remove existing token if it exists
      const existingTokenIndex = userTokens.findIndex(t => t.token === token);
      if (existingTokenIndex >= 0) {
        userTokens[existingTokenIndex].isActive = true;
      } else {
        userTokens.push({
          token,
          platform,
          userId,
          isActive: true,
        });
      }

      this.logger.log(`Device token registered for user ${userId} on ${platform}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to register device token for user ${userId}: ${error.message}`);
      return false;
    }
  }

  async unregisterDeviceToken(userId: string, token: string): Promise<boolean> {
    try {
      const userTokens = this.deviceTokens.get(userId);
      if (!userTokens) {
        return false;
      }

      const tokenIndex = userTokens.findIndex(t => t.token === token);
      if (tokenIndex >= 0) {
        userTokens[tokenIndex].isActive = false;
        this.logger.log(`Device token unregistered for user ${userId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to unregister device token for user ${userId}: ${error.message}`);
      return false;
    }
  }

  async getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokens.get(userId) || [];
  }

  async clearInactiveTokens(): Promise<void> {
    for (const [userId, tokens] of this.deviceTokens.entries()) {
      const activeTokens = tokens.filter(token => token.isActive);
      this.deviceTokens.set(userId, activeTokens);
    }
    this.logger.log('Cleared inactive device tokens');
  }
}
