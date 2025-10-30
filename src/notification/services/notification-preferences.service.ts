import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType, NotificationChannel } from '../dto/notification.dto';
import { NotificationPreferencesDto, UpdateNotificationPreferencesDto } from '../dto/notification.dto';

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);
  private preferencesCache = new Map<string, NotificationPreferencesDto>();

  constructor(private readonly prisma: PrismaService) {}

  async getUserPreferences(userId: string): Promise<NotificationPreferencesDto> {
    // Check cache first
    if (this.preferencesCache.has(userId)) {
      return this.preferencesCache.get(userId)!;
    }

    try {
      // Mock implementation - replace with actual Prisma query when user preferences table is added
      const preferences = await this.getDefaultPreferences(userId);
      
      // Cache the preferences
      this.preferencesCache.set(userId, preferences);
      
      return preferences;
    } catch (error) {
      this.logger.error(`Failed to get preferences for user ${userId}: ${error.message}`);
      return this.getDefaultPreferences(userId);
    }
  }

  async updateUserPreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    try {
      // Mock implementation - replace with actual Prisma update when user preferences table is added
      const currentPreferences = await this.getUserPreferences(userId);
      
      const updatedPreferences: NotificationPreferencesDto = {
        ...currentPreferences,
        ...updateDto,
        typePreferences: {
          ...currentPreferences.typePreferences,
          ...updateDto.typePreferences,
        },
      };

      // Update cache
      this.preferencesCache.set(userId, updatedPreferences);
      
      this.logger.log(`Preferences updated for user ${userId}`);
      return updatedPreferences;
    } catch (error) {
      this.logger.error(`Failed to update preferences for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async shouldSendNotification(
    userId: string,
    type: NotificationType,
    channel: NotificationChannel,
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      // Check if channel is enabled
      if (!this.isChannelEnabled(preferences, channel)) {
        return false;
      }

      // Check if notification type is enabled
      if (!preferences.typePreferences[type]) {
        return false;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        // Only send urgent notifications during quiet hours
        return type === NotificationType.SYSTEM_ALERT;
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to check notification preferences for user ${userId}: ${error.message}`);
      // Default to allowing notifications if preferences can't be loaded
      return true;
    }
  }

  async getUsersForNotificationType(
    type: NotificationType,
    channel: NotificationChannel,
  ): Promise<string[]> {
    try {
      // Mock implementation - in real implementation, query database for users who have this notification type enabled
      const allUsers = Array.from(this.preferencesCache.keys());
      const eligibleUsers: string[] = [];

      for (const userId of allUsers) {
        const shouldSend = await this.shouldSendNotification(userId, type, channel);
        if (shouldSend) {
          eligibleUsers.push(userId);
        }
      }

      return eligibleUsers;
    } catch (error) {
      this.logger.error(`Failed to get users for notification type ${type}: ${error.message}`);
      return [];
    }
  }

  private async getDefaultPreferences(userId: string): Promise<NotificationPreferencesDto> {
    return {
      userId,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      typePreferences: {
        [NotificationType.ORDER_CREATED]: true,
        [NotificationType.ORDER_UPDATED]: true,
        [NotificationType.ORDER_STATUS_CHANGED]: true,
        [NotificationType.PAYMENT_RECEIVED]: true,
        [NotificationType.PAYMENT_FAILED]: true,
        [NotificationType.SHIPMENT_CREATED]: true,
        [NotificationType.SHIPMENT_IN_TRANSIT]: true,
        [NotificationType.SHIPMENT_DELIVERED]: true,
        [NotificationType.ORDER_CANCELLED]: true,
        [NotificationType.REFUND_PROCESSED]: true,
        [NotificationType.SUPPORT_TICKET_CREATED]: true,
        [NotificationType.SUPPORT_TICKET_UPDATED]: true,
        [NotificationType.SYSTEM_ALERT]: true,
        [NotificationType.PROMOTIONAL]: false,
      },
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'UTC',
    };
  }

  private isChannelEnabled(preferences: NotificationPreferencesDto, channel: NotificationChannel): boolean {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return preferences.emailEnabled;
      case NotificationChannel.SMS:
        return preferences.smsEnabled;
      case NotificationChannel.PUSH:
        return preferences.pushEnabled;
      case NotificationChannel.IN_APP:
        return preferences.inAppEnabled;
      case NotificationChannel.WEBHOOK:
        return true; // Webhooks are always enabled
      default:
        return false;
    }
  }

  private isInQuietHours(preferences: NotificationPreferencesDto): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: preferences.timezone || 'UTC' 
    });

    const startTime = preferences.quietHoursStart;
    const endTime = preferences.quietHoursEnd;

    // Handle case where quiet hours span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  // Clear cache when preferences are updated
  clearUserCache(userId: string): void {
    this.preferencesCache.delete(userId);
  }

  // Clear all cache
  clearAllCache(): void {
    this.preferencesCache.clear();
  }

  // Get notification statistics
  async getNotificationStats(userId: string): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: Record<NotificationType, number>;
    notificationsByChannel: Record<NotificationChannel, number>;
  }> {
    // Mock implementation - replace with actual database queries
    return {
      totalNotifications: 0,
      unreadNotifications: 0,
      notificationsByType: {} as Record<NotificationType, number>,
      notificationsByChannel: {} as Record<NotificationChannel, number>,
    };
  }
}
