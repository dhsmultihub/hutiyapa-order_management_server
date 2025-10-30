import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderWebSocketGateway } from '../websocket/websocket.gateway';
import { EmailNotificationService } from './services/email-notification.service';
import { SmsNotificationService } from './services/sms-notification.service';
import { PushNotificationService } from './services/push-notification.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationQueryDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private notifications: any[] = []; // Mock database

  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketGateway: OrderWebSocketGateway,
    private readonly emailService: EmailNotificationService,
    private readonly smsService: SmsNotificationService,
    private readonly pushService: PushNotificationService,
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  async createNotification(createDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    this.logger.log(`Creating notification for user ${createDto.userId} of type ${createDto.type}`);

    try {
      // Create notification record
      const notification = {
        id: BigInt(this.notifications.length + 1),
        userId: BigInt(createDto.userId),
        type: createDto.type,
        title: createDto.title,
        message: createDto.message,
        channels: createDto.channels,
        priority: createDto.priority || NotificationPriority.MEDIUM,
        data: createDto.data || {},
        isRead: false,
        createdAt: new Date(),
        readAt: null,
        scheduledAt: createDto.scheduledAt ? new Date(createDto.scheduledAt) : null,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
      };

      this.notifications.push(notification);

      // Send notifications through enabled channels
      await this.sendNotificationThroughChannels(notification);

      this.logger.log(`Notification created with ID ${notification.id}`);
      return this.mapNotificationToResponseDto(notification);
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  async sendOrderNotification(
    userId: string,
    type: NotificationType,
    orderData: any,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
  ): Promise<void> {
    this.logger.log(`Sending order notification to user ${userId} for ${type}`);

    const notificationData = {
      userId,
      type,
      title: this.getOrderNotificationTitle(type, orderData),
      message: this.getOrderNotificationMessage(type, orderData),
      channels: await this.getEnabledChannelsForUser(userId, type),
      priority,
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        ...orderData,
      },
    };

    await this.createNotification(notificationData);
  }

  async sendSystemNotification(
    type: NotificationType,
    title: string,
    message: string,
    data: any = {},
    priority: NotificationPriority = NotificationPriority.HIGH,
  ): Promise<void> {
    this.logger.log(`Sending system notification: ${type}`);

    // Get all users who should receive this notification
    const eligibleUsers = await this.preferencesService.getUsersForNotificationType(
      type,
      NotificationChannel.IN_APP,
    );

    // Send to all eligible users
    const notifications = eligibleUsers.map(userId => ({
      userId,
      type,
      title,
      message,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority,
      data,
    }));

    await Promise.all(notifications.map(notification => this.createNotification(notification)));

    // Send broadcast via WebSocket
    this.websocketGateway.emitBroadcastNotification({
      type,
      title,
      message,
      data,
      priority,
    }, ['admin', 'employee']);
  }

  async getUserNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{ notifications: NotificationResponseDto[]; total: number }> {
    this.logger.log(`Getting notifications for user ${userId}`);

    let filteredNotifications = this.notifications.filter(n => n.userId.toString() === userId);

    // Apply filters
    if (query.type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === query.type);
    }

    if (query.isRead !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.isRead === query.isRead);
    }

    // Sort by creation date (newest first)
    filteredNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    return {
      notifications: paginatedNotifications.map(n => this.mapNotificationToResponseDto(n)),
      total: filteredNotifications.length,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationResponseDto> {
    this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);

    const notification = this.notifications.find(
      n => n.id.toString() === notificationId && n.userId.toString() === userId,
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.mapNotificationToResponseDto(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.logger.log(`Marking all notifications as read for user ${userId}`);

    const userNotifications = this.notifications.filter(n => n.userId.toString() === userId);
    userNotifications.forEach(notification => {
      notification.isRead = true;
      notification.readAt = new Date();
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting notification ${notificationId} for user ${userId}`);

    const index = this.notifications.findIndex(
      n => n.id.toString() === notificationId && n.userId.toString() === userId,
    );

    if (index === -1) {
      throw new Error('Notification not found');
    }

    this.notifications.splice(index, 1);
  }

  // Notification preferences management
  async getUserPreferences(userId: string): Promise<NotificationPreferencesDto> {
    return this.preferencesService.getUserPreferences(userId);
  }

  async updateUserPreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.preferencesService.updateUserPreferences(userId, updateDto);
  }

  // Device token management for push notifications
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<boolean> {
    return this.pushService.registerDeviceToken(userId, token, platform);
  }

  async unregisterDeviceToken(userId: string, token: string): Promise<boolean> {
    return this.pushService.unregisterDeviceToken(userId, token);
  }

  private async sendNotificationThroughChannels(notification: any): Promise<void> {
    const { userId, type, title, message, channels, priority, data } = notification;

    for (const channel of channels) {
      try {
        const shouldSend = await this.preferencesService.shouldSendNotification(
          userId.toString(),
          type,
          channel,
        );

        if (!shouldSend) {
          this.logger.log(`Skipping ${channel} notification for user ${userId} due to preferences`);
          continue;
        }

        switch (channel) {
          case NotificationChannel.EMAIL:
            await this.emailService.sendEmail(
              data.email || 'user@example.com', // Mock email - replace with actual user email
              type,
              data,
              priority,
            );
            break;

          case NotificationChannel.SMS:
            await this.smsService.sendSMS(
              data.phoneNumber || '+1234567890', // Mock phone - replace with actual user phone
              type,
              data,
              priority,
            );
            break;

          case NotificationChannel.PUSH:
            await this.pushService.sendPushNotification(
              userId.toString(),
              type,
              data,
              priority,
            );
            break;

          case NotificationChannel.IN_APP:
            this.websocketGateway.emitNotification(userId.toString(), {
              id: notification.id.toString(),
              type,
              title,
              message,
              data,
              priority,
            });
            break;

          case NotificationChannel.WEBHOOK:
            // Implement webhook sending logic here
            this.logger.log(`Webhook notification sent for user ${userId}`);
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send ${channel} notification to user ${userId}: ${error.message}`);
      }
    }
  }

  private async getEnabledChannelsForUser(
    userId: string,
    type: NotificationType,
  ): Promise<NotificationChannel[]> {
    const preferences = await this.preferencesService.getUserPreferences(userId);
    const channels: NotificationChannel[] = [];

    if (preferences.emailEnabled) channels.push(NotificationChannel.EMAIL);
    if (preferences.smsEnabled) channels.push(NotificationChannel.SMS);
    if (preferences.pushEnabled) channels.push(NotificationChannel.PUSH);
    if (preferences.inAppEnabled) channels.push(NotificationChannel.IN_APP);

    return channels;
  }

  private getOrderNotificationTitle(type: NotificationType, orderData: any): string {
    switch (type) {
      case NotificationType.ORDER_CREATED:
        return `Order Confirmed - #${orderData.orderNumber}`;
      case NotificationType.ORDER_STATUS_CHANGED:
        return `Order Status Updated - #${orderData.orderNumber}`;
      case NotificationType.PAYMENT_RECEIVED:
        return `Payment Received - #${orderData.orderNumber}`;
      case NotificationType.SHIPMENT_IN_TRANSIT:
        return `Order Shipped - #${orderData.orderNumber}`;
      case NotificationType.SHIPMENT_DELIVERED:
        return `Order Delivered - #${orderData.orderNumber}`;
      case NotificationType.ORDER_CANCELLED:
        return `Order Cancelled - #${orderData.orderNumber}`;
      default:
        return `Order Update - #${orderData.orderNumber}`;
    }
  }

  private getOrderNotificationMessage(type: NotificationType, orderData: any): string {
    switch (type) {
      case NotificationType.ORDER_CREATED:
        return `Your order #${orderData.orderNumber} has been confirmed and is being processed.`;
      case NotificationType.ORDER_STATUS_CHANGED:
        return `Your order #${orderData.orderNumber} status has changed from ${orderData.oldStatus} to ${orderData.newStatus}.`;
      case NotificationType.PAYMENT_RECEIVED:
        return `Payment of $${orderData.amount} has been received for order #${orderData.orderNumber}.`;
      case NotificationType.SHIPMENT_IN_TRANSIT:
        return `Your order #${orderData.orderNumber} has been shipped and is on its way!`;
      case NotificationType.SHIPMENT_DELIVERED:
        return `Your order #${orderData.orderNumber} has been delivered successfully.`;
      case NotificationType.ORDER_CANCELLED:
        return `Your order #${orderData.orderNumber} has been cancelled. Reason: ${orderData.reason}`;
      default:
        return `Update regarding your order #${orderData.orderNumber}.`;
    }
  }

  private mapNotificationToResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id.toString(),
      userId: notification.userId.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      channels: notification.channels,
      priority: notification.priority,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      scheduledAt: notification.scheduledAt,
      expiresAt: notification.expiresAt,
    };
  }
}