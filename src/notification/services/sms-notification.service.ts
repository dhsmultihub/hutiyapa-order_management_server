import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType, NotificationPriority } from '../dto/notification.dto';

// Mock SMS service - replace with actual SMS provider (Twilio, AWS SNS, etc.)
interface SMSProvider {
    sendSMS(to: string, message: string): Promise<boolean>;
}

@Injectable()
export class SmsNotificationService {
    private readonly logger = new Logger(SmsNotificationService.name);
    private smsProvider: SMSProvider;

    constructor(private readonly configService: ConfigService) {
        this.initializeSMSProvider();
    }

    private initializeSMSProvider() {
        // Mock implementation - replace with actual SMS provider
        this.smsProvider = {
            sendSMS: async (to: string, message: string): Promise<boolean> => {
                this.logger.log(`[MOCK SMS] Sending to ${to}: ${message}`);
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 100));
                return true;
            },
        };
    }

    async sendSMS(
        to: string,
        type: NotificationType,
        data: any,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
    ): Promise<boolean> {
        try {
            const message = this.formatSMSMessage(type, data);

            // Check if SMS should be sent based on priority and time
            if (!this.shouldSendSMS(priority)) {
                this.logger.log(`SMS not sent to ${to} due to priority/time restrictions`);
                return false;
            }

            const result = await this.smsProvider.sendSMS(to, message);

            if (result) {
                this.logger.log(`SMS sent successfully to ${to} for ${type}`);
            } else {
                this.logger.error(`Failed to send SMS to ${to} for ${type}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`SMS sending error to ${to} for ${type}: ${error.message}`);
            return false;
        }
    }

    private formatSMSMessage(type: NotificationType, data: any): string {
        const maxLength = 160; // Standard SMS length limit
        let message = '';

        switch (type) {
            case NotificationType.ORDER_CREATED:
                message = `Order confirmed! #${data.orderNumber} - $${data.totalAmount}. Track at: ${data.trackingUrl}`;
                break;

            case NotificationType.ORDER_STATUS_CHANGED:
                message = `Order #${data.orderNumber} status: ${data.oldStatus} → ${data.newStatus}. Track: ${data.trackingUrl}`;
                break;

            case NotificationType.PAYMENT_RECEIVED:
                message = `Payment received for order #${data.orderNumber} - $${data.amount}. Processing now.`;
                break;

            case NotificationType.SHIPMENT_IN_TRANSIT:
                message = `Your order #${data.orderNumber} is on the way! Track: ${data.trackingNumber} (${data.carrier})`;
                break;

            case NotificationType.SHIPMENT_DELIVERED:
                message = `Order #${data.orderNumber} delivered! Delivered at ${data.deliveryAddress} on ${new Date(data.deliveredAt).toLocaleDateString()}`;
                break;

            case NotificationType.ORDER_CANCELLED:
                message = `Order #${data.orderNumber} cancelled. Reason: ${data.reason}. ${data.refundAmount ? `Refund: $${data.refundAmount}` : ''}`;
                break;

            case NotificationType.PAYMENT_FAILED:
                message = `Payment failed for order #${data.orderNumber}. Please update payment method.`;
                break;

            case NotificationType.REFUND_PROCESSED:
                message = `Refund processed for order #${data.orderNumber} - $${data.refundAmount}. Check your account.`;
                break;

            case NotificationType.SUPPORT_TICKET_CREATED:
                message = `Support ticket #${data.ticketNumber} created. We'll respond within 24 hours.`;
                break;

            case NotificationType.SUPPORT_TICKET_UPDATED:
                message = `Update on ticket #${data.ticketNumber}: ${data.status}. Check your account for details.`;
                break;

            case NotificationType.SYSTEM_ALERT:
                message = `System Alert: ${data.message}. Please check your account.`;
                break;

            default:
                message = data.message || 'Notification from Hutiyapa Order Management';
        }

        // Truncate if too long
        if (message.length > maxLength) {
            message = message.substring(0, maxLength - 3) + '...';
        }

        return message;
    }

    private shouldSendSMS(priority: NotificationPriority): boolean {
        const currentHour = new Date().getHours();

        // Don't send SMS during quiet hours (10 PM to 8 AM) unless urgent
        if (priority !== NotificationPriority.URGENT && (currentHour >= 22 || currentHour < 8)) {
            return false;
        }

        // Always send urgent notifications
        if (priority === NotificationPriority.URGENT) {
            return true;
        }

        // Send high priority notifications during business hours
        if (priority === NotificationPriority.HIGH && currentHour >= 9 && currentHour <= 18) {
            return true;
        }

        // Send medium priority notifications during business hours
        if (priority === NotificationPriority.MEDIUM && currentHour >= 9 && currentHour <= 17) {
            return true;
        }

        // Send low priority notifications only during business hours
        if (priority === NotificationPriority.LOW && currentHour >= 10 && currentHour <= 16) {
            return true;
        }

        return false;
    }

    // Validate phone number format
    validatePhoneNumber(phoneNumber: string): boolean {
        // Basic phone number validation - adjust based on your requirements
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
    }

    // Format phone number for SMS provider
    formatPhoneNumber(phoneNumber: string): string {
        // Remove all non-digit characters
        const digits = phoneNumber.replace(/\D/g, '');

        // Add country code if not present (assuming US +1)
        if (digits.length === 10) {
            return `+1${digits}`;
        }

        // Add + if not present
        if (!phoneNumber.startsWith('+')) {
            return `+${digits}`;
        }

        return phoneNumber;
    }
}
