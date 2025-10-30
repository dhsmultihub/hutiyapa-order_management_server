import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationType, NotificationPriority } from '../dto/notification.dto';

interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

@Injectable()
export class EmailNotificationService {
    private readonly logger = new Logger(EmailNotificationService.name);
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
            port: this.configService.get('SMTP_PORT', 587),
            secure: false,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }

    async sendEmail(
        to: string,
        type: NotificationType,
        data: any,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
    ): Promise<boolean> {
        try {
            const template = this.getEmailTemplate(type, data);
            const emailOptions = {
                from: this.configService.get('SMTP_FROM', 'noreply@hutiyapa.com'),
                to,
                subject: template.subject,
                html: template.html,
                text: template.text,
            };

            const result = await this.transporter.sendMail(emailOptions);
            this.logger.log(`Email sent successfully to ${to} for ${type}: ${result.messageId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to} for ${type}: ${error.message}`);
            return false;
        }
    }

    private getEmailTemplate(type: NotificationType, data: any): EmailTemplate {
        const baseTemplate = {
            header: this.getEmailHeader(),
            footer: this.getEmailFooter(),
        };

        switch (type) {
            case NotificationType.ORDER_CREATED:
                return {
                    subject: `Order Confirmation - #${data.orderNumber}`,
                    html: `
            ${baseTemplate.header}
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h2>Order Confirmation</h2>
              <p>Thank you for your order! Your order #${data.orderNumber} has been confirmed.</p>
              <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${data.orderNumber}</p>
                <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
                <p><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${data.status}</p>
              </div>
              <p>You can track your order status in your account dashboard.</p>
            </div>
            ${baseTemplate.footer}
          `,
                    text: `Order Confirmation - #${data.orderNumber}\n\nThank you for your order! Your order #${data.orderNumber} has been confirmed.\n\nOrder Details:\n- Order Number: ${data.orderNumber}\n- Total Amount: $${data.totalAmount}\n- Order Date: ${new Date(data.orderDate).toLocaleDateString()}\n- Status: ${data.status}\n\nYou can track your order status in your account dashboard.`,
                };

            case NotificationType.ORDER_STATUS_CHANGED:
                return {
                    subject: `Order Status Update - #${data.orderNumber}`,
                    html: `
            ${baseTemplate.header}
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h2>Order Status Update</h2>
              <p>Your order #${data.orderNumber} status has been updated.</p>
              <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>Previous Status:</strong> ${data.oldStatus}</p>
                <p><strong>New Status:</strong> ${data.newStatus}</p>
                <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>You can track your order status in your account dashboard.</p>
            </div>
            ${baseTemplate.footer}
          `,
                    text: `Order Status Update - #${data.orderNumber}\n\nYour order #${data.orderNumber} status has been updated.\n\nPrevious Status: ${data.oldStatus}\nNew Status: ${data.newStatus}\nUpdated: ${new Date().toLocaleString()}\n\nYou can track your order status in your account dashboard.`,
                };

            case NotificationType.PAYMENT_RECEIVED:
                return {
                    subject: `Payment Received - Order #${data.orderNumber}`,
                    html: `
            ${baseTemplate.header}
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h2>Payment Received</h2>
              <p>We have received your payment for order #${data.orderNumber}.</p>
              <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>Order Number:</strong> ${data.orderNumber}</p>
                <p><strong>Amount Paid:</strong> $${data.amount}</p>
                <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
                <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
              </div>
              <p>Your order will now be processed and shipped soon.</p>
            </div>
            ${baseTemplate.footer}
          `,
                    text: `Payment Received - Order #${data.orderNumber}\n\nWe have received your payment for order #${data.orderNumber}.\n\nOrder Number: ${data.orderNumber}\nAmount Paid: $${data.amount}\nPayment Method: ${data.paymentMethod}\nTransaction ID: ${data.transactionId}\n\nYour order will now be processed and shipped soon.`,
                };

            case NotificationType.SHIPMENT_IN_TRANSIT:
                return {
                    subject: `Your Order is on the Way - #${data.orderNumber}`,
                    html: `
            ${baseTemplate.header}
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h2>Your Order is on the Way!</h2>
              <p>Great news! Your order #${data.orderNumber} has been shipped and is on its way to you.</p>
              <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
                <p><strong>Carrier:</strong> ${data.carrier}</p>
                <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
              </div>
              <p><a href="${data.trackingUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Your Package</a></p>
            </div>
            ${baseTemplate.footer}
          `,
                    text: `Your Order is on the Way - #${data.orderNumber}\n\nGreat news! Your order #${data.orderNumber} has been shipped and is on its way to you.\n\nTracking Number: ${data.trackingNumber}\nCarrier: ${data.carrier}\nEstimated Delivery: ${data.estimatedDelivery}\n\nTrack your package: ${data.trackingUrl}`,
                };

            case NotificationType.SHIPMENT_DELIVERED:
                return {
                    subject: `Order Delivered - #${data.orderNumber}`,
                    html: `
            ${baseTemplate.header}
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h2>Order Delivered!</h2>
              <p>Your order #${data.orderNumber} has been successfully delivered.</p>
              <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>Delivered On:</strong> ${new Date(data.deliveredAt).toLocaleString()}</p>
                <p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
              </div>
              <p>We hope you enjoy your purchase! If you have any questions, please don't hesitate to contact us.</p>
            </div>
            ${baseTemplate.footer}
          `,
                    text: `Order Delivered - #${data.orderNumber}\n\nYour order #${data.orderNumber} has been successfully delivered.\n\nDelivered On: ${new Date(data.deliveredAt).toLocaleString()}\nDelivery Address: ${data.deliveryAddress}\n\nWe hope you enjoy your purchase! If you have any questions, please don't hesitate to contact us.`,
                };

            case NotificationType.ORDER_CANCELLED:
                return {
                    subject: `Order Cancelled - #${data.orderNumber}`,
                    html: `
            ${baseTemplate.header}
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h2>Order Cancelled</h2>
              <p>Your order #${data.orderNumber} has been cancelled.</p>
              <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>Reason:</strong> ${data.reason}</p>
                <p><strong>Cancelled On:</strong> ${new Date(data.cancelledAt).toLocaleString()}</p>
                ${data.refundAmount ? `<p><strong>Refund Amount:</strong> $${data.refundAmount}</p>` : ''}
              </div>
              <p>If you have any questions about this cancellation, please contact our support team.</p>
            </div>
            ${baseTemplate.footer}
          `,
                    text: `Order Cancelled - #${data.orderNumber}\n\nYour order #${data.orderNumber} has been cancelled.\n\nReason: ${data.reason}\nCancelled On: ${new Date(data.cancelledAt).toLocaleString()}\n${data.refundAmount ? `Refund Amount: $${data.refundAmount}\n` : ''}\nIf you have any questions about this cancellation, please contact our support team.`,
                };

            default:
                return {
                    subject: data.title || 'Notification',
                    html: `
            ${baseTemplate.header}
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h2>${data.title || 'Notification'}</h2>
              <p>${data.message}</p>
            </div>
            ${baseTemplate.footer}
          `,
                    text: `${data.title || 'Notification'}\n\n${data.message}`,
                };
        }
    }

    private getEmailHeader(): string {
        return `
      <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
        <h1>Hutiyapa Order Management</h1>
      </div>
    `;
    }

    private getEmailFooter(): string {
        return `
      <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
        <p>© 2025 Hutiyapa Order Management System. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    `;
    }
}
